from __future__ import annotations
import pathlib
import os
from yandex_cloud_ml_sdk import YCloudML
from dotenv import load_dotenv

load_dotenv()
YANDEX_FOLDER_ID = os.getenv("YANDEX_CLOUD_FOLDER")
YANDEX_GPT_AUTH = os.getenv("YANDEX_CLOUD_API_KEY")

class ImageGenerator:

    def __init__ (self, model: str = "yandex-art"):
        self.sdk = YCloudML(
            folder_id = YANDEX_FOLDER_ID,
            auth = YANDEX_GPT_AUTH
        )
        self.art_model = self.sdk.models.image_generation(model)
        self.art_model = self.art_model.configure(width_ratio=16, height_ratio=9, seed=50)

    def generate_image_by_text(self, text: str, out_path: pathlib.Path = pathlib.Path("res/gener.jpg")):
        operation = self.art_model.run_deferred(text)
        result = operation.wait()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(result.image_bytes)

    def generate_list_of_images(self, promts: list[str], root_path: str):
        number = 0
        for text in promts:
            number += 1
            self.generate_image_by_text(text, pathlib.Path(root_path + "gener" + str(number) + ".jpg"))
