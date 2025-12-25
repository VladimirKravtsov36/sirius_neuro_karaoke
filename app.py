from __future__ import annotations
import os
import librosa
import subprocess
import torch
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from music_service.music_service import SearchDownloadTrack
from skey.skey import detect_key
from separation.source_separator import SourceSeparator
from KaraokeProcessor.KaraokeProcessor import KaraokeProcessor, AudioLoader, LyricsProvider, LLMTextEditor, ASRService, Aligner
from yandex_generate.image_generator import ImageGenerator

load_dotenv()
TOKEN = os.getenv("YANDEX_MUSIC_API_TOKEN")

app = FastAPI(title="Music Backend API")
app.mount("/data", StaticFiles(directory="data/"), name="separated_songs")
app.mount("/assets", StaticFiles(directory="Frontend/dist/assets"), name="assets")

yandex_service = SearchDownloadTrack(token=TOKEN)

# --- Pydantic модели (для валидации входящих JSON) ---
class TrackRequest(BaseModel):
    track_id: int  # Фронтенд должен прислать {"track_id": "12345"}

def get_free_gpu():
    """Get the ID of the GPU with the least memory usage."""
    try:
        # Query GPU memory usage
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        if result.returncode != 0:
            # Default to GPU 0 if nvidia-smi fails
            return "0"
        
        lines = result.stdout.strip().split('\n')
        min_usage = float('inf')
        selected_gpu = 0
        
        for i, line in enumerate(lines):
            used, total = map(int, line.split(', '))
            usage = used / total
            if usage < min_usage:
                min_usage = usage
                selected_gpu = i
                
        return str(selected_gpu)
    except Exception:
        # Default to GPU 0 if anything goes wrong
        return "0"

# --- Эндпоинты (Ручки API) ---

@app.get("/search")
def search_tracks(q: str):
    """
    Пример: GET /search?q=Linkin Park
    Возвращает список треков (без скачивания).
    """
    try:
        results = yandex_service.search(q)
        
        return [
            {
                "id": str(track['id']),
                "title": track['title'],
                "artist": track['artists'],
                "coverUrl": "https://" + track['cover'] 
            }
            for track in results["tracks"]
            ]
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
    # Select and set GPU before processing
    gpu_id = get_free_gpu()
    os.environ["CUDA_VISIBLE_DEVICES"] = gpu_id
    print(f"Using GPU: {gpu_id}")

    try:
        # Шаг 1: Скачиваем (используем первый класс)
        print(f"Запрос на обработку трека ID: {request.track_id}")
        track_file_dto = yandex_service.download_and_get_info(request.track_id)

        # Шаг 2: Передаем в skey, определяем тональность
        sf, _ = librosa.load(track_file_dto.file_path)
        key = detect_key(audio=sf, extension=track_file_dto.format, device="cuda")
        #key = 'C'
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

        img_generator = ImageGenerator()
        img_generator.generate_list_of_images(kp.create_image_prompts(2), f"{base_url}/images/")
        
        return {
            "status": "success",
            "track_info": {
                "id": track_file_dto.track_id,
                "title": track_file_dto.title,
                "artist": track_file_dto.artist,
                "coverUrl": "http://" + track_file_dto.cover_url
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
            "karaokeData": processed_lyrics # Результат работы KaraokeProcessor
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
            full_url = f"/data/separated_songs/htdemucs_ft/{track_folder}/images/" + filename
            urls.append(full_url)
        
        return {
            "status": "success",
            "images": urls
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/", StaticFiles(directory="Frontend/dist", html=True), name="frontend_root")

# For local startup:
if __name__ == "__main__":
   # results = yandex_service.search("Her")
   # print(results)
   # results = yandex_service.search("her")
        
   # print([{"id": str(track['id']),"title": track['title'],"artist": track['artists'],"coverUrl": "https://" + track['cover'] }for track in results["tracks"]])
    import uvicorn
    # Launch the server locally
    uvicorn.run(app, host="127.0.0.1", port=3001)