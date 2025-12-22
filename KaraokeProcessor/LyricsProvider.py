from pathlib import Path
import json
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

    def __init__(self, LRC_path: str):
        self._path = Path(LRC_path)
        if not self._path.exists():
            logger.error(f'Audio file not found: {str(self._path)}')
            raise FileNotFoundError(f"Audio file not found: {str(self._path)}")
        
        self.segments = []
        current_text = []
        start_time = None
        with open(self._path, 'r') as file:
            logger.info(f'Loading lyrics from {str(self._path)}...')
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
                if start_time is None and text:
                    start_time = time_sec
                if text:
                    current_text.append(text)
                if current_text and start_time is not None and time_sec != start_time:
                    self.segments.append(Segment(
                        start=start_time,
                        end=time_sec,
                        text=" ".join(current_text)
                    ))
                    current_text = []
                    start_time = None
            if current_text and start_time is not None:
                self.segments.append(Segment(
                    start=start_time,
                    end=start_time + 10, 
                    text=" ".join(current_text)
                ))
                
    def make_json(self) -> str:
        json_segs = [
            { "text": seg.text, "start": seg.start, "end": seg.end}
            for seg in self.segments
        ]
        return json_segs
