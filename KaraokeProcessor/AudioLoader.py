import torchaudio
import numpy as np
from pathlib import Path
import logging
logger = logging.getLogger(__name__)


class AudioLoader:
    """
    Загружает аудиофайл и приводит его к формату (mono, 16kHz)
    """
    
    def __init__(self, target_sr: int = 16000):
        self.target_sr = target_sr
        self._path = Path()

    def load(self, path: str) -> np.ndarray:
        """
        Загружает аудио и возвращает numpy array
        """
        path = Path(path)
        if not path.exists():
            logger.error(f'Audio file not found: {path}')
            raise FileNotFoundError(f"Audio file not found: {path}")
        self._path = path
        # Чтение аудио
        waveform, sr = torchaudio.load(str(path))  # [channels, samples]

        # Приведение к моно (усреднение каналов)
        if waveform.shape[0] > 1:
            waveform = waveform.mean(dim=0, keepdim=True)

        # Ресемплинг к 16kHz
        if sr != self.target_sr:
            resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=self.target_sr)
            waveform = resampler(waveform)
        logger.info(f'Successfully loaded audio {path}!')
        # Возвращаем как 1D numpy array
        return waveform.squeeze(0).numpy()

    def get_path(self) -> Path:
        return self._path