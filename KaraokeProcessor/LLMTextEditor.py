import openai
import json
from .LLMPrompt import edit_prompt, correct_prompt, image_prompt
from dotenv import load_dotenv
import os
import logging

# Настройка логирования
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Загрузка переменных окружения
load_dotenv()
YANDEX_CLOUD_API_KEY = os.getenv("YANDEX_CLOUD_API_KEY")
YANDEX_CLOUD_FOLDER = os.getenv("YANDEX_CLOUD_FOLDER")
YANDEX_CLOUD_MODEL = os.getenv("YANDEX_CLOUD_MODEL")
YANDEX_CLOUD_BASE_URL = os.getenv("YANDEX_CLOUD_BASE_URL")

class LLMTextEditor:
    def __init__(self):
        try:
            if not all([YANDEX_CLOUD_API_KEY, YANDEX_CLOUD_FOLDER, YANDEX_CLOUD_MODEL, YANDEX_CLOUD_BASE_URL]):
                raise ValueError("Не все переменные окружения заданы!")

            self.client = openai.OpenAI(
                api_key=YANDEX_CLOUD_API_KEY,
                base_url=YANDEX_CLOUD_BASE_URL,
                project=YANDEX_CLOUD_FOLDER
            )
            logger.info("Клиент LLM успешно инициализирован.")
        except Exception as e:
            logger.error(f"Ошибка инициализации клиента: {e}")
            raise

    def edit(self, data: str, reference: str | None = None):
        if reference is None:
            messages = [
                {"role": "system", "content": edit_prompt},
                {"role": "user", "content": data}
            ]
        else:
            messages = [
                {"role": "system", "content": correct_prompt},
                {"role": "user", "content": data + '\n\n' + reference}
            ]
        try:
            response = self.client.chat.completions.create(
                model=YANDEX_CLOUD_MODEL,
                messages=messages,
                stream=False,
                temperature=0.1,
                max_tokens=2000
            )
        except Exception as e:
            logger.error(f"Ошибка запроса к модели: {e}")
            return None

        try:
            response_text = response.choices[0].message.content
        except (AttributeError, IndexError) as e:
            logger.error(f"Некорректная структура ответа: {e}")
            return None

        # Проверка на валидный JSON
        try:
            parsed_data = json.loads(response_text)
            return parsed_data
        except json.JSONDecodeError:
            print(response_text)
            logger.warning(f"Модель вернула невалидный JSON, возвращаем сырой текст.")
            return response_text
    def create_image_prompts(self, num: int, data: str):
        messages = [
                {"role": "user", "content": image_prompt.format(data, num)}
            ]
        
        try:
            response = self.client.chat.completions.create(
                model=YANDEX_CLOUD_MODEL,
                messages=messages,
                stream=False,
                temperature=0.1,
                max_tokens=2000
            )
        except Exception as e:
            logger.error(f"Ошибка запроса к модели: {e}")
            return None
        plist = response.choices[0].message.content.split('[IMAGE]')
        return plist