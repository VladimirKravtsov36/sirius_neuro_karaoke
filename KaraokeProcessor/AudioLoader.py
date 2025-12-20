import torchaudio
import whisperx
import numpy as np
from pathlib import Path
import logging
logger = logging.getLogger(__name__)


class AudioLoader:
    """
    Загружает аудиофайл и приводит его к формату (mono, 16kHz)
    """
    
    def __init__(self, path: str, target_sr: int = 16000):
        self.target_sr = target_sr
        self._path = Path(path)
        if not self._path.exists():
            logger.error(f'Audio file not found: {path}')
            raise FileNotFoundError(f"Audio file not found: {path}")

    def load(self):
        """
        Загружает аудио
        """
        path = str(self._path)
        audio = whisperx.load_audio(path)
        logger.info(f'Successfully loaded audio {path}!')
        return audio