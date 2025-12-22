import os
import librosa
from skey import detect_key

os.environ["CUDA_VISIBLE_DEVICES"] = "2"

sf, sr = librosa.load("/home/garifulinpa/sirius_neuro_karaoke/data/333460_Radiohead - Idioteque.mp3")


key = detect_key(
    audio=sf,
    extension="mp3",
    device="cuda"
)

print(key)
