from pathlib import Path
from dataclasses import dataclass
import logging
logger = logging.getLogger(__name__)

@dataclass
class Segment:
    start: float
    end: float
    text: str


class LyricsProvider:
    
    def time_to_seconds(self, time_str: str) -> float:
        minutes, seconds = map(float, time_str.split(":"))
        return minutes * 60 + seconds

    def __init__(self, LRC_path: Path):
        with open(LRC_path, 'r') as file:
            logger.info(f'Loading lyrics from {str(LRC_path)}...')
            lines = [line.strip() for line in file.readlines()]
            for line in lines:
                if not line.startswith('['):
                    continue
                closing_bracket = line.find("]")
                if closing_bracket == -1:
                    continue
                time_str = line[1:closing_bracket]
                text = line[closing_bracket+1:].strip()
                time_sec = self.time_to_seconds(time_str)
                

            