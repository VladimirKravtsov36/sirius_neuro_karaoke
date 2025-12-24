import pyrubberband as pyrb
import librosa
import numpy as np
import soundfile as sf
import os
from skey import detect_key

class Song:
    KEY_MAP = {
        0: " A Major",
        1: " Bb Major",
        2: " B Major",
        3: " C Major",
        4: " C# Major",
        5: " D Major",
        6: " D# Major",
        7: " E Major",
        8: " F Major",
        9: " F# Major",
        10: " G Major",
        11: " G# Major",
        12: " B minor",
        13: " C minor",
        14: " C# minor",
        15: " D minor",
        16: " D# minor",
        17: " E minor",
        18: " F minor",
        19: " F# minor",
        20: " G minor",
        21: " G# minor",
        22: " A minor",
        23: " Bb minor",
    }

    def __init__(self, name, audiofile, sr, meta=None):
        # Metadata
        self.name = name
        self.meta = meta # Represents words&&tackts
        self.audio = {
            'original' : None,
            'drums' : None,
            'bass' : None,
            'vocal' : None,
            'other' : None
        }
        self.sr = sr
        self.audio['original'] = audiofile
        self.get_key()

    def get_key(self):
        self.num_key = detect_key(audio=self.audio['original'], extension="mp3", device="cuda")
        self.key = self.KEY_MAP[self.num_key]
        print(self.key)

    # def divide_on_stems(self):
        #TODO сделать разделение на аудиодорожки

    def pitch_shift(self, key_index):
        shifted_stems = {}
        stem_keys = ['original']
        for audio_type in stem_keys:
            source_audio = self.audio[audio_type]
            if source_audio is None:
                shifted_stems[audio_type] = None
            else:
                shifted_audio = librosa.effects.pitch_shift(source_audio, sr=self.sr, n_steps=(key_index - self.num_key))
                print(len(shifted_audio))
                shifted_stems[audio_type] = shifted_audio
        
        valid_audio_files = [arr for arr in shifted_stems.values() if arr is not None]
        if not valid_audio_files:
            return None
        # for arr in valid_audio_files:
        #     print(len(arr))
        lenght = min(len(arr) for arr in valid_audio_files)
        result_mix = np.zeros(lenght, dtype=np.float32)
        for audio_type in stem_keys:
            source_audio = shifted_stems[audio_type]
            if source_audio is not None:
                trimmed_audio = source_audio[:lenght]
                shifted_stems[audio_type] = trimmed_audio
                result_mix += trimmed_audio
        print(len(result_mix))
        new_song = Song(self.name + self.KEY_MAP[key_index], result_mix, self.sr, self.meta)
        for audio_type in stem_keys:
            new_song.audio[audio_type] = shifted_stems[audio_type]
        return new_song

    def export_audio(self, filename="ryu.mp3", track_type="original"):
        """Saves the current state of the audio to a file."""
        if self.audio[track_type] is not None:
            sf.write(filename, self.audio[track_type], self.sr)
            print(f"Saved {track_type} to {filename}")