import openai
import json
from .LLMPrompt import *
from dotenv import load_dotenv
import os
import logging
logger = logging.getLogger(__name__)
load_dotenv()

class LLMTextEditor:
    def __init__(self, model: str):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENROUTER_BASE_URL")
        if not self.api_key:
            raise ValueError("API key не найден. Установите OPENROUTER_API_KEY в окружении.")
        self.client = openai.OpenAI(api_key=self.api_key, base_url=base_url)
        self.model = model
        
    def edit_wo_reference(self, data: str):
        req_str = json.dumps(data, ensure_ascii=False, indent=2)
        response = self.client.chat.completions.create(
            messages = [
                {"role": "system", "content": edit_prompt},
                {"role": "user", "content": req_str}
            ],
            model = self.model
        )
        print(response)
        return response
        