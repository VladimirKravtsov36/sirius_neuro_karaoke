from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

class TextAlignment(Enum):
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    
class VerticalPosition(Enum):
    TOP = "top"
    MIDDLE = "middle"
    BOTTOM = "bottom"

@dataclass(frozen=True)
class Style(ABC):
    name: str
    font_family: str
    font_size: int
    
    primary_color: str
    secondary_color: str | None = None
    
    bold: bool = False
    italic: bool = False
    underline: bool = False
    
    alignment: TextAlignment = TextAlignment.CENTER
    position: VerticalPosition = VerticalPosition.BOTTOM
    
    fade_in_ms: int | None
    fade_out_ms: int | None
    