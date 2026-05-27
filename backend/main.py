import uuid
import uvicorn
import asyncio
import shutil
import os
from typing import Dict, Any, Optional

from celery import chain
from celery.result import AsyncResult
import redis.asyncio as redis

from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware


from AI_model import *
from config import API_SECRET
from database.requests import *
from database.models import async_main
from scheme import *
from worker import celery_app, transcribe_audio_task, process_llm_task

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


redis_cli = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)


async def verify_api_key(
    x_api_key: str = Header(...),
):

    if x_api_key != API_SECRET:

        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )


@app.get("/")
async def root(x_api_key: str = Header(...)):
    await verify_api_key(x_api_key)

    return {"message": "Hello World"}


# GET /api/doctors/{doctorId}/dashboard
@app.get("/api/doctors/{doctorId}/dashboard", response_model=Dashboard)
async def get_doctor_dashboard(doctorId: int, x_api_key: str = Header(...)):
    await verify_api_key(x_api_key)

    if not await check_doctor_exists(doctorId):
        return JSONResponse(
            status_code=404,
            content={"message": f"Doctor with id {doctorId} not found"},
        )

    response = await rq_doctor_dashboard(doctorId)
    return JSONResponse(
        status_code=200,
        content=response.model_dump(),
    )


@app.get("/api/patients/{patientId}/details", response_model=PatientFullDetailsSchema)
async def get_patient_details(patientId: int, x_api_key: str = Header(...)):
    await verify_api_key(x_api_key)

    details = await get_patient_full_details(patientId)
    if details is None:
        return JSONResponse(
            status_code=404,
            content={"message": f"Patient with id {patientId} not found"},
        )

    details.active_analysis_task = await redis_cli.get(f"patient_task:{patientId}")

    return JSONResponse(
        status_code=200,
        content=details.model_dump(),
    )


@app.post("/api/patients/{patientId}/recordings", status_code=status.HTTP_202_ACCEPTED)
async def voice_endpoint(
    patientId: int,
    audio: UploadFile = File(..., description="Аудиофайл"),
    x_api_key: str = Header(...),
):

    await verify_api_key(x_api_key)
    if await get_patient(patientId) is None:
        return JSONResponse(
            status_code=404,
            content={"message": f"Patient with id {patientId} not found"},
        )

    # 1. Создаем папку для временных файлов (если её нет)
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)

    # Формируем уникальное имя файла
    file_path = os.path.join(temp_dir, f"{patientId}_audio.wav")

    analysis_id = f"analysis_{patientId}_{uuid.uuid4().hex[:6]}"
    # 2. Сохраняем присланные байты на жесткий диск
    with open(file_path, "wb") as f:
        f.write(await audio.read())

    # 3. Отправляем задачу в Celery (ЦЕХ 1)
    chain(
        celery_app.tasks["worker.transcribe_audio_task"]
        .s(patientId)
        .set(task_id=f"transcribe_{analysis_id}"),
        celery_app.tasks["worker.process_llm_task"]
        .s(patientId)
        .set(task_id=f"llm_{analysis_id}"),
    ).apply_async()

    await redis_cli.set(f"patient_task:{patientId}", analysis_id, ex=600)

    return {"status": "started", "task_id": analysis_id}


@app.put("/api/patients/{patientId}/record", response_model=MedicalRecordSchema)
async def update_record(
    patientId: int,
    record_update: MedicalRecordSchema,
    x_api_key: str = Header(...),
):
    await verify_api_key(x_api_key)
    status, resp = await put_medical_record(patientId, record_update)

    if status != 200:
        return JSONResponse(
            status_code=status,
            content={"message": resp},
        )

    return resp


# Это функция-генератор. Она будет висеть в памяти и раз в секунду "выплевывать" статус
async def event_stream(task_id: str, request: Request):
    # 1. Пытаемся найти ID родителя в Redis
    llm_task = AsyncResult(f"llm_{task_id}", app=celery_app)
    transcribe_task = AsyncResult(f"transcribe_{task_id}", app=celery_app)
    patient_id = task_id.split("_")[1]

    # 2. ЖЕСТКАЯ ЗАЩИТА ОТ ФЕЙКОВЫХ ИЛИ УСТАРЕВШИХ ID
    # Если связи в Redis нет, и задача реально не выполнена (Celery отдает дефолтный PENDING)
    if transcribe_task.state == "PENDING" and llm_task.state == "PENDING":
        error_json = StreamErrorSchema(
            status="Error", message="Задача не найдена"
        ).model_dump_json()
        yield f"data: {error_json}\n\n"
        return

    # 3. Начинаем наш стандартный цикл
    while not await request.is_disconnected():

        if llm_task.ready():
            if llm_task.state == "SUCCESS":
                await redis_cli.delete(f"patient_task:{patient_id}")

                yield f"data: {StreamResponseSchema(
                    status="Success",
                    step="completed",
                    result=llm_task.result,
                ).model_dump_json()}\n\n"
            else:
                yield f"data: {StreamErrorSchema(
                    status="Error",
                    message="Ошибка на этапе LLM",
                ).model_dump_json()}\n\n"

            await asyncio.sleep(0.5)
            break

        if transcribe_task:
            if transcribe_task.state == "FAILURE":
                yield f"data: {StreamErrorSchema(
                    status="Error",
                    message="Ошибка на этапе LLM",
                ).model_dump_json()}\n\n"
                break
            elif transcribe_task.state == "PENDING":
                step = "queue"
            elif transcribe_task.state == "STARTED":
                step = "cpu_whisper"
            elif transcribe_task.state == "SUCCESS":
                step = "io_llm"
            else:
                step = "queue"
        else:
            step = "processing"

        yield f"data: {StreamResponseSchema(
            status="Processing",
            step=step,
        ).model_dump_json()}\n\n"

        await asyncio.sleep(1)


@app.get("/api/stream/task/{task_id}")
async def stream_task_result(
    task_id: str,
    request: Request,
    x_api_key: str = Header(...),
):
    """
    Эндпоинт для SSE-соединения. Возвращает непрерывный поток данных.
    """
    await verify_api_key(x_api_key)

    return StreamingResponse(
        event_stream(task_id, request),
        media_type="text/event-stream",  # Этот заголовок говорит браузеру, что это SSE
    )


if __name__ == "__main__":
    asyncio.run(async_main())
    asyncio.run(start_db())
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
