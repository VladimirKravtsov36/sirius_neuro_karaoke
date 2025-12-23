import whisperx
import torch
import logging
from pathlib import Path
logger = logging.getLogger(__name__)

class ASRService:
    def __init__(self, model: str, device: str):
        if device=='cuda' and torch.cuda.is_available():
            self._device = device
            self._compute_type = "float16"
        elif device=='cpu':
            self._device = device
            self._compute_type = "float32"
        else:
            logger.error('Incompatible device!')
        logger.info(f'Using device {self._device}')
        self._batch_size = 16
        self._model = whisperx.load_model(model, device, compute_type=self._compute_type)
        
    def transcribe(self, audio):
        result =self._model.transcribe(audio, batch_size=self._batch_size)
        return result 
