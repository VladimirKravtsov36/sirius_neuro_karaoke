from abc import ABC, abstractmethod
from typing import List
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from .Style import Style
@dataclass
class SubtitleLine:
    start: float  # время начала в секундах
    end: float    # время конца в секундах
    text: str
    style: str  # имя стиля



class TitlesCreator(ABC):
    """Абстрактный класс для генерации титров."""
    
    def __init__(self, json: Optional[List[Dict[str, Any]]] = None, default_style: str = "Default"):
        """
        Если передан json, парсит его в список SubtitleLine.
        Ожидаемый формат:
        - после ASR: [{"start": float, "end": float, "text": str}, ...]
        - после alignment: [{"word": str, "start": float, "end": float}, ...]
        """
        self.lines: List[SubtitleLine] = []
        self.default_style = default_style
        if json:
            self._parse_json(json)
    
    def _parse_json(self, data: List[Dict[str, Any]]):
        """Парсит JSON и добавляет SubtitleLine."""
        for item in data:
            if "text" in item and "start" in item and "end" in item:
                # сегменты ASR
                self.lines.append(
                    SubtitleLine(
                        start=float(item["start"]),
                        end=float(item["end"]),
                        text=str(item["text"]),
                        style=self.default_style
                    )
                )
            elif "word" in item and "start" in item and "end" in item:
                # слова после alignment
                self.lines.append(
                    SubtitleLine(
                        start=float(item["start"]),
                        end=float(item["end"]),
                        text=str(item["word"]),
                        style=self.default_style
                    )
                )
            else:
                continue
    
    @abstractmethod
    def add_line(self, line: SubtitleLine) -> None:
        """Добавить строку титров."""
        pass
    
    @abstractmethod
    def create(self) -> str:
        """Сгенерировать текст титров в формате конкретного наследника."""
        pass