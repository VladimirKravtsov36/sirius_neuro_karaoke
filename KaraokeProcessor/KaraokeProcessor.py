from typing import Dict
import whisperx
from .Aligner import *
from .LyricsProvider import *
from .ASRService import *
from .AudioLoader import *
from .LLMTextEditor import *

class KaraokeProcessor:

    def __init__(
        self,
        audio_loader : AudioLoader,
        lyrics_provider : LyricsProvider | None,
        text_editor : LLMTextEditor, 
        asr_service : ASRService,
        aligner : Aligner,
    ):
        self.audio_loader = audio_loader
        self.lyrics_provider = lyrics_provider
        self.text_editor = text_editor
        self.asr_service = asr_service
        self.aligner = aligner

    def process(self) -> Dict:
        audio = self.audio_loader.load()
        asr_result = self.asr_service.transcribe(audio)
        if self.lyrics_provider is not None:
            asr_correct_result = self.text_editor.edit_w_reference(asr_result, self.lyrics_provider.process_text())
        else:
            asr_correct_result = self.text_editor.edit_wo_reference(asr_result)
        aligned_segs = self.aligner.align(audio, asr_correct_result["segments"], asr_correct_result["language"])
        return aligned_segs
        