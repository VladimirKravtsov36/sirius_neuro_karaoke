import whisperx
import torch
import sys
from pathlib import Path
from datetime import timedelta

# ------------------ CONFIG ------------------

PAUSE_MERGE_SEC = 0.4     # объединять сегменты, если пауза меньше
MIN_K_CS = 3              # минимальная длительность \k
MAX_LINE_LEN = 60         # перенос строки при длинном тексте

SKIP_TOKENS = {",", ".", "?", "!", "…", "♪"}

# ------------------ HELPERS ------------------

def ass_time(sec: float) -> str:
    td = timedelta(seconds=sec)
    s = int(td.total_seconds())
    cs = int((sec - s) * 100)
    h = s // 3600
    m = (s % 3600) // 60
    s = s % 60
    return f"{h}:{m:02}:{s:02}.{cs:02}"

def clean_word(word: str) -> str:
    return word.replace("{", "").replace("}", "").strip()

def build_karaoke_text(words, seg_end):
    parts = []
    last_end = None
    visible_len = 0

    for w in words:
        if w.get("start") is None or w.get("end") is None:
            continue

        text = clean_word(w["word"])
        if not text or text in SKIP_TOKENS:
            continue

        # пробел между словами
        if parts:
            text = " " + text

        dur_cs = max(
            MIN_K_CS,
            int((w["end"] - w["start"]) * 100)
        )

        parts.append(f"{{\\k{dur_cs}}}{text}")
        visible_len += len(text)
        last_end = w["end"]

    # хвост до конца сегмента
    if last_end is not None:
        tail = seg_end - last_end
        if tail > 0.05:
            parts.append(f"{{\\k{int(tail*100)}}} ")

    text = "".join(parts)

    # перенос строки, если слишком длинно
    if visible_len > MAX_LINE_LEN and " " in text:
        text = text.replace(" ", "\\N", 1)

    return text

def merge_segments(segments):
    merged = []
    for seg in segments:
        if not merged:
            merged.append(seg)
            continue

        prev = merged[-1]
        gap = seg["start"] - prev["end"]

        if gap < PAUSE_MERGE_SEC:
            prev["end"] = seg["end"]
            prev["words"].extend(seg.get("words", []))
        else:
            merged.append(seg)

    return merged

# ------------------ MAIN ------------------

def main(audio_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    audio_path = Path(audio_path)
    assert audio_path.exists(), "Файл не найден"

    print(f"▶ device: {device}")

    # 1️⃣ Whisper
    model = whisperx.load_model(
        "large-v3",
        device=device,
        compute_type=compute_type
    )

    audio = whisperx.load_audio(str(audio_path))
    result = model.transcribe(audio, batch_size=16)

    # 2️⃣ Alignment
    align_model, metadata = whisperx.load_align_model(
        result["language"],
        device=device
    )

    aligned = whisperx.align(
        result["segments"],
        align_model,
        metadata,
        audio,
        device=device
    )

    segments = merge_segments(aligned["segments"])

    # 3️⃣ ASS HEADER
    ass = [
        "[Script Info]",
        "Title: WhisperX Karaoke",
        "ScriptType: v4.00+",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour,"
        "OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline,"
        "Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Karaoke,Arial,54,&H00E0E0E0,&H0000FF00,&H00000000,&H80000000,"
        "0,0,1,4,1,2,40,40,45,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Text",
    ]

    # 4️⃣ EVENTS
    for seg in segments:
        words = seg.get("words", [])
        if not words:
            continue

        text = build_karaoke_text(words, seg["end"])
        if not text.strip():
            continue

        ass.append(
            f"Dialogue: 0,"
            f"{ass_time(seg['start'])},"
            f"{ass_time(seg['end'])},"
            f"Karaoke,{text}"
        )

    out = audio_path.with_suffix(".karaoke.ass")
    out.write_text("\n".join(ass), encoding="utf-8")

    print(f"✅ Готово: {out}")

# ------------------ RUN ------------------

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("python whx_titles.py song.mp3")
        sys.exit(1)

    main(sys.argv[1])