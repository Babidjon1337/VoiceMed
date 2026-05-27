import os
from pathlib import Path
import whisper
import torch  # Добавляем импорт PyTorch для проверки видеокарты

BASE_DIR = Path(__file__).resolve().parent
os.environ["PATH"] += os.pathsep + str(BASE_DIR)


class WhisperService:
    _model = None  # Переменная для хранения модели (Ленивая загрузка)

    @classmethod
    def _get_model(cls):
        """
        Загружает модель только при первом вызове.
        Автоматически выбирает видеокарту (cuda) или процессор (cpu).
        """
        if cls._model is None:
            # Проверяем, доступна ли видеокарта NVIDIA
            device = "cuda" if torch.cuda.is_available() else "cpu"

            # Загружаем модель
            cls._model = whisper.load_model("base", device=device)
            print("✅ Модель Whisper успешно загружена!")

        return cls._model

    @staticmethod
    def transcribe(audio_path: str) -> str:
        """Синхронная функция для Celery воркера"""
        # Получаем модель (загрузится только один раз при первом аудио)
        model = WhisperService._get_model()

        # Расшифровываем
        result = model.transcribe(
            audio_path,
            language="ru",
        )
        return result["text"]
