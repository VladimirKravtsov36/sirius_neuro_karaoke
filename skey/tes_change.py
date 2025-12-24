import librosa
import pyrubberband as pyrb
from classes.song import Song
sf, sr = librosa.load("/home/iltneral/work/sirius_neuro_karaoke/skey/songs/Lyudvig_van_Betkhoven_-_Lunnaya_sonata_48113982.mp3")
jopa = Song("Jopa", sf, sr)
sieg = jopa.pitch_shift(jopa.num_key + 2)
# sf.write("ruy.mp3", sf, sr)
# # jopa.export_audio()
# print(sieg.key)
sieg.export_audio()
