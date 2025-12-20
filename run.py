import os
from KaraokeProcessor.KaraokeProcessor import *

os.environ["CUDA_VISIBLE_DEVICES"] = "2"

kp = KaraokeProcessor(
    AudioLoader("/home/garifulinpa/sirius_neuro_karaoke/data/333460_Radiohead - Idioteque.mp3"),
    None,
    ASRService("large", "cuda"),
    Aligner("cuda")
)

print(kp.process())