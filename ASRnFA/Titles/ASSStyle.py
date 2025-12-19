from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from .Style import *

class ASSStyle(Style):
    outline_color: str = "&H00000000"
    back_color: str = "&H00000000"
    strikeout: bool = False
    spacing: int = 0
    angle: int = 0
    border_style: int = 1
    outline: float = 2.0
    shadow: float = 0.0
    margin_l: int = 10
    margin_r: int = 10
    margin_v: int = 10
    
    
    def alignment_to_an(self) -> int:
        """Преобразует логическое выравнивание в ASS \an (1–9)"""
        mapping = {
            TextAlignment.LEFT: 1,   # левый низ
            TextAlignment.CENTER: 2, # центр низ
            TextAlignment.RIGHT: 3,  # правый низ
        }
        return mapping[self.alignment]

    
    def ass_header_style(self) -> str:
        """Генерирует строку Style: для ASS файла с учетом всех свойств"""
        bold = -1 if self.bold else 0  # в ASS -1 = true, 0 = false
        italic = -1 if self.italic else 0
        underline = -1 if self.underline else 0
        strikeout = -1 if self.strikeout else 0
        secondary = self.secondary_color or self.primary_color
        fade_in = self.fade_in_ms or 0
        fade_out = self.fade_out_ms or 0
        style_line = (
            f"Style: {self.name},"
            f"{self.font_family},{self.font_size},"
            f"{self.primary_color},{secondary},"
            f"{self.outline_color},{self.back_color},"
            f"{bold},{italic},{underline},{strikeout},"
            f"{self.scale_x},{self.scale_y},{self.spacing},{self.angle},"
            f"{self.border_style},{self.outline},{self.shadow},"
            f"{self.alignment_to_an()},{self.margin_l},{self.margin_r},{self.margin_v},"
            f"{self.encoding}"
        )
        return style_line
    
    