from AI_model import *

text = WhisperService.transcribe("temp_audio/test_audio2.ogg")
print("Распознанный текст:", text)
ч = {
    {
        "status": "SUCCESS",
        "result": 134235,
        "traceback": null,
        "children": [],
        "date_done": "2026-05-26T21:17:36.476299+03:00",
        "parent_id": "809ff610-e5a6-4b5a-b3a8-ac71fb332da1",
        "name": "worker.io_task",
        "args": [134230],
        "kwargs": {},
        "worker": "io_worker@DESKTOP-BOGRG55",
        "retries": 0,
        "queue": "io_queue",
        "task_id": "08e75012-babb-49a0-9108-3291e12a19fc",
    }
}
x = {
    "status": "SUCCESS",
    "result": 134230,
    "traceback": null,
    "children": [[["08e75012-babb-49a0-9108-3291e12a19fc", null], null]],
    "date_done": "2026-05-26T21:17:26.461675+03:00",
    "name": "worker.cpu_task",
    "args": [13423],
    "kwargs": {},
    "worker": "cpu_worker@DESKTOP-BOGRG55",
    "retries": 0,
    "queue": "cpu_queue",
    "task_id": "809ff610-e5a6-4b5a-b3a8-ac71fb332da1",
}


# @app.post("/task/{number}")
# async def create_task(number: int):
#     response_redis = await redis_cli.get(f"result:{number}")

#     if response_redis:
#         print(f"Результат для {number} уже есть в Redis: {response_redis}")
#         return {"result": response_redis}

#     task = chain(
#         cpu_task.s(number),
#         io_task.s(),
#     ).apply_async()

#     await redis_cli.set(f"task_number:{task.id}", number, ex=600)

#     return {"task_id": task.id, "status": "queued"}


# @app.get("/result/{task_id}")
# async def get_task_result(task_id: str):
#     task = celery_app.AsyncResult(task_id)

#     if task.status == "SUCCESS":
#         response_redis = await redis_cli.get(f"task_number:{task_id}")
#         await redis_cli.delete(f"task_number:{task_id}")

#         # Сохраняем результат в Redis на 10 минут
#         print(
#             f"Сохраняем результат в Redis: result:{response_redis} -> {task.result} (на 10 минут)"
#         )
#         await redis_cli.set(f"result:{response_redis}", task.result, ex=600)

#     return {
#         "task_id": task.id,
#         "status": task.status,
#         "ready": task.ready(),
#         "result": task.result if task.ready() else None,
#     }


# @app.post("/api/patients/{patientId}/recordings")
# async def voice_endpoint(
#     patientId: int,
#     audio: UploadFile = File(..., description="Аудиофайл"),
#     x_api_key: str = Header(...),
# ):

#     await verify_api_key(x_api_key)
#     if await get_patient(patientId) is None:
#         return JSONResponse(
#             status_code=404,
#             content={"message": f"Patient with id {patientId} not found"},
#         )

#     # 1. Создаем папку для временных файлов (если её нет)
#     temp_dir = "temp_audio"
#     os.makedirs(temp_dir, exist_ok=True)

#     # Формируем уникальное имя файла
#     file_path = os.path.join(temp_dir, f"{patientId}_{audio.filename}")

#     # 2. Сохраняем присланные байты на жесткий диск
#     with open(file_path, "wb") as f:
#         f.write(await audio.read())

#     # 3. Отправляем задачу в Celery (ЦЕХ 1)
#     task_chain = chain(
#         transcribe_audio_task.s(patientId, file_path) | process_llm_task.s(patientId)
#     ).apply_async()

#     # Сохраняем ID задачи для конкретного пациента в Redis
#     # ex=600 означает, что ключ сам удалится через 10 минут, если что-то пойдет не так
#     celery_app.backend.client.set(f"patient_task:{patientId}", task_chain.id, ex=600)

#     return JSONResponse(
#         status_code=202, content={"taskId": task_chain.id, "status": "processing"}
#     )

#     # # читаем аудио
#     # audio_bytes = await audio.read()

#     # # whisper
#     # text = await WhisperService.transcribe(audio_bytes)

#     # llm_response = await llm_service.llm_response(text)

#     # record_data = MedicalRecordSchema.model_validate(llm_response)

#     # await save_transcription_and_medical_record(
#     #     patientId=patientId,
#     #     text=text,
#     #     llm_response=record_data.model_dump(),
#     # )

#     # medical_record = await get_medical_record(patientId)

#     # return JSONResponse(
#     #     status_code=200,
#     #     content={
#     #         "transcript": text,
#     #         "record": medical_record.model_dump() if medical_record else None,
#     #     },
#     # )
