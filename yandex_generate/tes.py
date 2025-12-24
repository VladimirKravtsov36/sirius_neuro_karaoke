from __future__ import annotations
import pathlib
import os
from dotenv import load_dotenv

from image_generator import ImageGenerator
from KaraokeProcessor.KaraokeProcessor import *
from AudioLoader import *
from LLMTextEditor import *
from ASRService import *
from LyricsProvider import *
from Aligner import *


kp = KaraokeProcessor(
    AudioLoader("skey/songs/Daft_Punk_-_Around_The_World_47897831.mp3"),
    None,
    LLMTextEditor(),
    ASRService("small", "cpu"),
    Aligner("cpu")
)

kp.process()

abab = ImageGenerator()
abab.generate_list_of_images(kp.create_image_prompts(10), "res/")