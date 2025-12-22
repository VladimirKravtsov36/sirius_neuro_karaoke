import os
from KaraokeProcessor import ASRService, Aligner, AudioLoader, KaraokeProcessor

os.environ["CUDA_VISIBLE_DEVICES"] = "2"

kp = KaraokeProcessor(
    AudioLoader("/home/garifulinpa/sirius_neuro_karaoke/data/178529_Linkin Park - Numb.mp3"),
    None,
    ASRService("large", "cuda"),
    Aligner("cuda")
)

print(kp.process())