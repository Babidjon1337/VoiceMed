# GolosMed — Инструкция по запуску

Краткое руководство по запуску всех компонентов бэкенда. Для работы требуется 4 открытых терминала.

### Шаг 1. Запуск Redis (Брокер и кэш)

- **Первый запуск (создание контейнера):**

```
docker run -d -p 6379:6379 --name golosmed-redis redis

```

- **Обычный запуск (если контейнер уже создан):**

```
docker start golosmed-redis

```

### Шаг 2. Запуск CPU-воркера (Whisper / Очередь аудио)

В новом терминале с активированным виртуальным окружением:

```
celery -A worker worker -Q transcribe_audio -n transcribe_worker@%h --loglevel=info --pool=solo

```

### Шаг 3. Запуск IO-воркера (LLM / Очередь сети)

В новом терминале с активированным виртуальным окружением:

```
celery -A worker worker -Q process_llm -n llm_worker@%h --loglevel=info --pool=threads --concurrency=5

```

### Шаг 4. Запуск FastAPI сервера

В новом терминале с активированным виртуальным окружением:

```
python main.py

```

_Или через uvicorn напрямую:_

```
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

```
