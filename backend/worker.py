import os
import asyncio
import time
from uuid import UUID
from celery import Celery

from AI_model import *
from database.requests import *
from scheme import *

celery_app = Celery(
    "worker",
    broker="redis://127.0.0.1:6379/0",
    backend="redis://127.0.0.1:6379/0",
)


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Moscow",
    enable_utc=True,
    task_track_started=True,  # ЖЕСТКО ГОВОРИМ: отслеживать момент старта воркера!
    result_extended=True,
    result_expires=1800,
)


# --- ЦЕХ 1: Расшифровка голоса---
@celery_app.task(queue="transcribe_audio")
def transcribe_audio_task(patient_id: int) -> str:
    """Задача для расшифровки аудио с помощью Whisper.
    Запускается в отдельной очереди, так как требует GPU."""

    text = WhisperService.transcribe(f"temp_audio/{patient_id}_audio.wav")

    # Удаляем временный файл
    if os.path.exists(f"temp_audio/{patient_id}_audio.wav"):
        os.remove(f"temp_audio/{patient_id}_audio.wav")

    return text


# --- ЦЕХ 2: Общение с LLM ---
# ДОБАВЛЕНЫ bind=True и max_retries=3 для включения логики авто-повтора
@celery_app.task(bind=True, queue="process_llm", max_retries=3)
def process_llm_task(
    self, transcript: str, patient_id: str
) -> UploadPatientFullDetailsSchema:
    """Задача для обработки текста через LLM и сохранения результата в БД."""

    async def process() -> UploadPatientFullDetailsSchema:
        # Если API отвалится или вернется плохой JSON, ошибка "вылетит" из этой функции
        llm_resp = await llm_service.llm_response(transcript)
        record_data = MedicalRecordSchema.model_validate(llm_resp)

        await save_transcription_and_medical_record(
            patientId=patient_id,
            text=transcript,
            llm_response=record_data.model_dump(),
        )
        transcripts = await get_last_transcription(patient_id)
        record = await get_medical_record(patient_id)

        return UploadPatientFullDetailsSchema(
            transcripts=transcripts, record=record
        ).model_dump()

    try:
        # Пытаемся выполнить процесс общения с нейросетью и БД
        medical_record = asyncio.run(process())

        return medical_record

    except Exception as exc:
        # ПЕРЕХВАТ ОШИБОК: Если вылетел таймаут или JSONDecodeError,
        # воркер не падает статусом FAILURE, а ждет 10 секунд и делает новую попытку.
        print(f"⚠️ Сбой при обращении к LLM: {exc}. Пробуем еще раз через 10 сек...")
        raise self.retry(exc=exc, countdown=10)
