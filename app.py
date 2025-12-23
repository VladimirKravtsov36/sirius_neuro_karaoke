import os
import librosa
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from music_service.music_service import SearchDownloadTrack
from skey.skey import detect_key
from separation.source_separator import SourceSeparator
from KaraokeProcessor.KaraokeProcessor import KaraokeProcessor, AudioLoader, LyricsProvider, LLMTextEditor, ASRService, Aligner


load_dotenv()
TOKEN = os.getenv("YANDEX_MUSIC_API_TOKEN")
os.environ["CUDA_VISIBLE_DEVICES"] = "5"

app = FastAPI(title="Music Backend API")
app.mount("/separated_songs", StaticFiles(directory="data/separated_songs"), name="separated_songs")

yandex_service = SearchDownloadTrack(token=TOKEN)

# --- Pydantic модели (для валидации входящих JSON) ---
class TrackRequest(BaseModel):
    track_id: str  # Фронтенд должен прислать {"track_id": "12345"}

# --- Эндпоинты (Ручки API) ---

@app.get("/search")
def search_tracks(query: str):
    """
    Пример: GET /search?q=Linkin Park
    Возвращает список треков (без скачивания).
    """
    try:
        results = yandex_service.search(query)
        return {"count": len(results), "items": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process-track")
def process_track(request: TrackRequest):
    """
    Пример: POST /process-track с JSON {"track_id": "123456"}
    1. Качает трек через YandexService
    2. Передает результат в AudioProcessorService
    3. Отдает отчет JSON
    """
    try:
        # Шаг 1: Скачиваем (используем первый класс)
        print(f"Запрос на обработку трека ID: {request.track_id}")
        track_file_dto = yandex_service.download_and_get_info(request.track_id)

        # Шаг 2: Передаем в skey, определяем тональность
        sf, _ = librosa.load(track_file_dto.file_path)
        key = detect_key(audio=sf, extension=track_file_dto.format, device="cuda")

        # Шаг 3: Передаем в source_separator, отделяем вокал от инструментала
        source_separator = SourceSeparator()
        source_separator.separate(track_file_dto.file_path, output_dir="data/separated_songs")

        # Генерируем ссылки для скачивания (для фронтенда)
        # Предполагаем, что сервер запущен локально
        base_url = f"data/separated_songs/htdemucs_ft/{Path(track_file_dto.file_name).stem}"
        vocal_filename = os.path.basename("vocals.mp3")
        instr_filename = os.path.basename("no_vocals.mp3")
        
        lyrics_provider = None
        if os.path.exists(track_file_dto.lyrics_path):
            lyrics_provider = LyricsProvider(track_file_dto.lyrics_path)

        kp = KaraokeProcessor(
            AudioLoader(os.path.abspath(f"{base_url}/{vocal_filename}")),
            lyrics_provider,
            LLMTextEditor(),
            ASRService("large-v3", "cuda"),
            Aligner("cuda")
        )
        processed_lyrics = kp.process()

        if not os.path.exists(f"{base_url}/images"):
            os.makedirs(f"{base_url}/images")
        
        return {
            "status": "success",
            "track_info": {
                "id": track_file_dto.track_id,
                "title": track_file_dto.title,
                "artist": track_file_dto.artist,
                "coverUrl": track_file_dto.cover_url
            },
            "analysis": {
                "key": key,  # Результат работы первого класса
            },
            "downloads": {
                # Ссылки на файлы для песни
                "vocals_url": f"{base_url}/{vocal_filename}",
                "instrumental_url": f"{base_url}/{instr_filename}",
                "images_url": f"{Path(track_file_dto.file_name).stem}"
            },
            "lyrics": processed_lyrics # Результат работы KaraokeProcessor
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail="Трек не найден")
    except Exception as e:
        print(f"Ошибка: {e}")
        return {
            "status": "error",
        }
    
@app.get("/images")
def get_images(track_folder: str):
    """
    Возвращает ссылки на картинки списком
    """
    try:
        files = os.listdir(f"data/separated_songs/htdemucs_ft/{track_folder}/images")

        urls = []
        for filename in files:
            full_url = f"/separated_songs/htdemucs_ft/{track_folder}/images/" + filename
            urls.append(full_url)
        
        return {
            "status": "success",
            "images": urls
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
# Для запуска локально:
if __name__ == "__main__":
    import uvicorn
    # Запуск сервера на порту 8000
    uvicorn.run(app, host="127.0.0.1", port=3001)