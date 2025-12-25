import demucs.separate
from pathlib import Path
import tempfile
import shutil

from .audio_converter import AudioConverter

DEMUCS_MODELS = [
    "htdemucs",
    "htdemucs_ft",
    "htdemucs_6s",
    "hdemucs_mmi",
    "mdx",
    "mdx_extra",
    "mdx_q",
    "mdx_extra_q",
    "SIG",
]


class SourceSeparator:
    def __init__(self, model: str = "mdx_q"):
        if model not in DEMUCS_MODELS:
            raise ValueError(
                f"Отсутствует данная модель: {model}\nДоступные модели: {DEMUCS_MODELS}"
            )
        self.model = model

    def _move_dir(self, input_dir: str, output_dir: str) -> None:
        input_dir = Path(input_dir)
        output_dir = Path(output_dir)

        if not input_dir.is_dir():
            raise ValueError(f"Источник не является директорией: {input_dir}")

        output_dir.mkdir(parents=True, exist_ok=True)

        for item in input_dir.rglob("*"):
            if item.is_file():
                target = output_dir / item.relative_to(input_dir)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(item), str(target))

    def separate(self, input_path: str, output_dir: str = "separated_songs") -> str:
        input_path = Path(input_path)
        if not input_path.exists():
            raise FileNotFoundError(f"Аудиофайл не найден: {input_path}")

        if input_path.suffix == "mp3":
            demucs.separate.main(
                [
                    "--mp3",
                    "--two-stems=vocals",
                    "-n",
                    self.model,
                    "-o",
                    output_dir,
                    str(input_path),
                ]
            )
        else:
            with tempfile.TemporaryDirectory() as tmpdir:
                song_mp3 = AudioConverter.any_to_mp3(str(input_path), tmpdir)
                demucs.separate.main(
                    [
                        "--mp3",
                        "--two-stems=vocals",
                        "-n",
                        self.model,
                        "-o",
                        tmpdir,
                        song_mp3,
                    ]
                )
                self._move_dir(Path(tmpdir) / self.model, Path(output_dir) / self.model)

        output_dir = Path(output_dir).resolve() / self.model / input_path.stem

        return output_dir
