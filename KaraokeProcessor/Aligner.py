import logging
logger = logging.getLogger(__name__)
import whisperx
from typing import List, Dict


class Aligner:
    def __init__(self, device: str):
        if device=='cuda' and torch.cuda.is_available():
            self._device = device
        elif device=='cpu':
            self._device = device
        else:
            logger.error('Incompatible device!')

    def align(
        self,
        audio,
        segments: List[Dict],
        language: str,
    ) -> List[Dict]:
        model_a, metadata = whisperx.load_align_model(
            language_code=language,
            device=self.device,
        )
        aligned = whisperx.align(
            segments,
            model_a,
            metadata,
            audio,
            self._device,
            return_char_alignments=False
        )

        return aligned["segments"]
