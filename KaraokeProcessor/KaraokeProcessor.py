from typing import Dict
import whisperx


class KaraokeProcessor:

    def __init__(
        self,
        audio_loader,
        lyrics_provider,
        asr_service,
        aligner,
        subtitle_editor,
        formatter,
        device
    ):
        self.audio_loader = audio_loader
        self.lyrics_provider = lyrics_provider
        self.asr_service = asr_service
        self.aligner = aligner
        self.device = device

    def process(self, track_id: str, audio_path: str) -> Dict:
        audio = self.audio_loader.load(audio_path)
       # segments = self.lyrics_provider.get_lyrics(track_id)
        asr_result = self.asr_service.transcribe(self.audio_loader.get_path())
        segments = asr_result["segments"]
        language = asr_result["language"]
        aligned_segments = self.aligner.align(
            audio=audio,
            segments=segments,
            language=language,
        )
        result = self.formatter.to_json(aligned_segments)
        return result