from __future__ import annotations
import asyncio
import pathlib
import os
from yandex_cloud_ml_sdk import AsyncYCloudML
from dotenv import load_dotenv

load_dotenv()
YANDEX_FOLDER_ID = os.getenv("YANDEX_CLOUD_FOLDER")
YANDEX_GPT_AUTH = os.getenv("YANDEX_CLOUD_API_KEY")


class ImageGenerator:
    def __init__(self, model: str = "yandex-art"):
        self.sdk = AsyncYCloudML(
            folder_id=YANDEX_FOLDER_ID,
            auth=YANDEX_GPT_AUTH
        )
        self.art_model = self.sdk.models.image_generation(model)
        self.art_model = self.art_model.configure(width_ratio=16, height_ratio=9, seed=50)

    async def generate_image_by_text(self, text: str, out_path: pathlib.Path) -> None:
        operation = await self.art_model.run_deferred(text)
        result = await operation
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(result.image_bytes)

    async def generate_list_of_images(self, prompts: list[str], root_path: str) -> None:
        out_dir = pathlib.Path(root_path)
        out_dir.mkdir(parents=True, exist_ok=True)

        tasks = [
            self.generate_image_by_text(
                text=text,
                out_path=out_dir / f"gener{i}.jpg"
            )
            for i, text in enumerate(prompts, start=1)
        ]
        await asyncio.gather(*tasks)