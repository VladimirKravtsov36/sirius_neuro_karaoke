from pathlib import Path
import re
from dataclasses import dataclass
import logging
logger = logging.getLogger(__name__)

class LyricsProvider:
    def __init__(self, path: str):
        self._path = Path(path)
        if not self._path.exists():
            logger.error(f'Text file not found: {path}')
            raise FileNotFoundError(f"Text file not found: {path}")
    def process_text(self):
        lrc_time_pattern = re.compile(r'\[\d{1,2}:\d{2}(?:\.\d{1,2})?\]')
        lines = self._path.read_text(encoding='utf-8').splitlines()
        cleaned_lines = []
        for line in lines:
            cleaned_line = lrc_time_pattern.sub('', line).strip()
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
        return '\n'.join(cleaned_lines)
