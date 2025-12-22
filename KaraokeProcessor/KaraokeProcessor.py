from typing import Dict
import whisperx
from Aligner import *
from LyricsProvider import *
from ASRService import *
from AudioLoader import *


class KaraokeProcessor:

    def __init__(
        self,
        audio_loader : AudioLoader,
        lyrics_provider : LyricsProvider | None,
        asr_service : ASRService,
        aligner : Aligner,
    ):
        self.audio_loader = audio_loader
        self.lyrics_provider = lyrics_provider
        self.asr_service = asr_service
        self.aligner = aligner

    def process(self) -> Dict:
        audio = self.audio_loader.load()
        asr_result = self.asr_service.transcribe(audio)
        aligned_segs = self.aligner.align(audio, asr_result["segments"], asr_result["language"])
        return aligned_segs
        