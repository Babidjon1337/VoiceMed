import json
import re

import httpx
from openai import AsyncOpenAI

from config import SYSTEM_PROMPT, AI_TOKEN, PROXY_URL


class LLMService:

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=AI_TOKEN,
            timeout=120.0,  # УВЕЛИЧИЛИ ТАЙМАУТ: Ждем ответ до 2 минут, чтобы избежать APITimeoutError
            # отключаем system proxy
            http_client=httpx.AsyncClient(
                # proxy=PROXY_URL,
                trust_env=False,
            ),
        )

    def parse_llm_json(
        self,
        text: str,
    ) -> dict:
        """
        Бронебойный парсер JSON от нейросетей.
        Умеет вытаскивать JSON из мусора и защищен от падений.
        """
        if not text or not text.strip():
            print("⚠️ Нейросеть вернула пустой ответ!")
            raise ValueError("Empty response from LLM")

        text = text.strip()

        # 1. Убираем markdown-разметку (```json ... ```)
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # 2. Пытаемся найти четкий JSON-блок (если модель добавила слова до или после скобок)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)

        # 3. Парсим и безопасно обрабатываем поля
        try:
            parsed_dict = json.loads(text)

            # Безопасное склеивание списков (на случай если нейросеть вернет null или строку вместо списка)
            medications = parsed_dict.pop("medications", [])
            treatment = parsed_dict.get("treatment", [])

            # Приводим к списку, если LLM ошиблась с типом данных
            if not isinstance(medications, list):
                medications = [medications] if medications else []
            if not isinstance(treatment, list):
                treatment = [treatment] if treatment else []

            parsed_dict["treatment"] = medications + treatment

            return parsed_dict

        except json.JSONDecodeError as e:
            print(f"❌ Ошибка парсинга JSON: {e}\nСырой текст от LLM: {text}")
            raise ValueError(f"Invalid JSON format from LLM: {text}")

    async def llm_response(
        self,
        text: str,
    ) -> dict:

        response = await self.client.chat.completions.create(
            model="openai/gpt-oss-120b:free",
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            extra_body={"reasoning": {"enabled": True}},
        )

        raw_text = response.choices[0].message.content

        # Отправляем сырой текст в наш надежный парсер
        data = self.parse_llm_json(raw_text)

        return data


llm_service = LLMService()
