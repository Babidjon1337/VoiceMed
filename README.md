# GolosMed (VoiceMed) 🎙️⚕️

Инновационная SaaS-платформа для автоматического заполнения медицинских карт с помощью голоса.
Система слушает речь врача во время приема, расшифровывает её с помощью нейросети Whisper, а затем структурирует данные (жалобы, симптомы, диагноз, показатели) с помощью LLM, формируя готовую электронную медицинскую карту.

## 🛠 Технологический стек

- **Бэкенд:** FastAPI (Python)
- **Асинхронные задачи:** Celery + Redis
- **AI Модели:** OpenAI Whisper (локально на GPU/CPU), OpenRouter LLM (API)
- **Фронтенд:** React, Vite, TailwindCSS
- **Стриминг данных:** Server-Sent Events (SSE) для отображения статуса в реальном времени.

---

## 🚀 Инструкция по локальному запуску

Для работы конвейера обработки аудио (FastAPI -> Redis -> Whisper -> LLM -> Frontend) необходимо запустить компоненты в разных окнах терминала.

### 1. Настройка окружения

В корневой папке бэкенда (`backend`) создайте файл `.env` и добавьте ключи:

```env
AI_TOKEN="ваш_ключ_от_openrouter"
API_SECRET="секретный_токен_для_защиты_api"
```

### 2. Запуск Redis (Брокер сообщений)

Redis нужен для координации очередей задач между FastAPI и Celery.

```bash
# Если у вас установлен Docker:
docker run -d -p 6379:6379 --name golosmed-redis redis

# Для повторного запуска существующего контейнера:
docker start golosmed-redis
```

### 3. Запуск FastAPI (Основной сервер)

Откройте новый терминал, перейдите в папку `backend`, активируйте виртуальное окружение и запустите Uvicorn:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Запуск CPU/GPU Воркера (Расшифровка аудио)

Воркер, отвечающий за работу с моделью Whisper (ЦЕХ 1).
Откройте новый терминал в папке `backend` (с активным venv):

```bash
celery -A worker worker -Q transcribe_audio -n whisper_worker@%h --loglevel=info --pool=solo
```

### 5. Запуск IO Воркера (Нейросеть и БД)

Воркер для работы с внешним API LLM (ЦЕХ 2). Поддерживает авто-повторы (retries) при таймаутах.
Откройте новый терминал в папке `backend` (с активным venv):

```bash
celery -A worker worker -Q process_llm -n llm_worker@%h --loglevel=info --pool=threads --concurrency=5
```

### 6. Запуск Frontend

Откройте новый терминал, перейдите в папку `frontend` и запустите React:

```bash
npm install
npm run dev
```

---

## 📦 Работа с Git и GitHub

### Важно: Настройка `.gitignore`

### Первичная загрузка (Инициализация)

```bash
git init
git add .
git commit -m "Первый коммит: инициализация VoiceMed"
git branch -M main
git remote add origin [https://github.com/ВАШ_НИК/VoiceMed.git]
git push -u origin main
```

### Ежедневное обновление кода

При внесении изменений в файлы используйте этот цикл из 3 команд:

```bash
git add .
git commit -m "Описание того, что вы изменили"
git push -u origin main
```

---

## 👨‍💻 Команда проекта

- Буланов Родион
- Потапов Глеб
- Кавалеристова София
