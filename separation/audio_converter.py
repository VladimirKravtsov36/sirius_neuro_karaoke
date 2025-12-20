from pydub import AudioSegment
from pathlib import Path


class AudioConverter:
    @staticmethod
    def _default_output_path(input_path: str, format: str) -> str:
        input_path = Path(input_path)
        return str(input_path.with_suffix("." + format))

    @staticmethod
    def any_to_mp3(
        input_path: str, output_path: str = None, bitrate: str = "320k"
    ) -> str:
        audio = AudioSegment.from_file(input_path)

        if output_path is None:
            output_path = AudioConverter._default_output_path(input_path, format="mp3")

        if Path(output_path).is_dir():
            output_path = (
                Path(output_path).resolve() / Path(input_path).name
            ).with_suffix(".mp3")
            output_path = str(output_path)

        if Path(output_path).suffix != ".mp3":
            raise ValueError(f"Неверный формат файла: {output_path}")

        audio.export(output_path, format="mp3", bitrate=bitrate)

        return output_path

    @staticmethod
    def any_to_wav(
        input_path: str, output_path: str = None, bitrate: str = "320k"
    ) -> str:
        audio = AudioSegment.from_file(input_path)

        if output_path is None:
            output_path = AudioConverter._default_output_path(input_path, format="wav")

        if Path(output_path).is_dir():
            output_path = (
                Path(output_path).resolve() / Path(input_path).name
            ).with_suffix(".wav")
            output_path = str(output_path)

        if Path(output_path).suffix != ".wav":
            raise ValueError(f"Неверный формат файла: {output_path}")

        audio.export(output_path, format="wav", bitrate=bitrate)

        return output_path
