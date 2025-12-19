import os
from dataclasses import dataclass
from typing import List, Optional
from yandex_music import Client

# Передается дальше
@dataclass
class DownloadedTrack:
    track_id: str
    title: str
    artist: str
    file_path: str  # Полный путь к скачанному треку
    lyrics_type: str # NONE - нет текста, LRC - с временными метками, TEXT - без временных меток
    lyrics: Optional[str] # Текст, если нашелся
    cover_url: str
    bitrate: int
    format: str


class SearchDownloadTrack:
    def __init__(self, token: str, download_folder: str = "downloads"):
        self.client = Client(token).init()
        self.download_folder = download_folder
        
        # Cоздаем папку для загрузок, если её нет
        if not os.path.exists(self.download_folder):
            os.makedirs(self.download_folder)

    def search(self, query: str, page: int = 0) -> dict:
        """
        Ищет треки. Возвращает список словарей (для отображения на сайте).
        Не скачивает файлы, только метаданные.
        """
        search_result = self.client.search(query, type_='track', page=page)
        
        if not search_result.tracks or not search_result.tracks.results:
            return {"total": 0, "tracks": []}

        results = []
        for track in search_result.tracks.results:
            artists = ", ".join([a.name for a in track.artists])
            results.append({
                "id": track.id,
                "title": track.title,
                "artists": artists,
                "duration": track.duration_ms,
                # Cсылка на обложку (нужно добавить размер, например 200x200)
                "cover": track.cover_uri.replace("%%", "200x200") if track.cover_uri else None
            })

        return {
            "total": search_result.tracks.total,
            "tracks": results
        }

    def process_track(self, track_id: str) -> DownloadedTrack:
        """
        Скачивает трек, получает текст и упаковывает всё в объект.
        Этот метод вызывается, когда пользователь нажал кнопку выбора.
        """
        # Получаем объект трека
        tracks = self.client.tracks([track_id])
        if not tracks:
            raise ValueError("Трек не найден")
        
        track = tracks[0]
        
        # Логика выбора битрейта
        download_info = track.get_download_info(get_direct_links=True)
        mp3_list = [i for i in download_info if i.codec == 'mp3']
        
        best_quality = max(
            mp3_list if mp3_list else download_info, 
            key=lambda x: x.bitrate_in_kbps
        )

        # Формируем путь файла
        # Используем ID в имени файла, чтобы избежать проблем с дублями или спецсимволами
        filename = f"{track.id}_{track.artists[0].name} - {track.title}.{best_quality.codec}"

        # Очистка имени файла от запрещенных символов
        valid_chars = "-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
        safe_filename = "".join(c for c in filename if c in valid_chars)
        
        full_path = os.path.join(self.download_folder, safe_filename)

        # Скачивание (если файла еще нет)
        if not os.path.exists(full_path):
            print(f"Скачиваю трек ID {track_id}...")
            best_quality.download(full_path)
        else:
            print(f"Файл уже существует: {full_path}")

        # Получение текста
        lyrics_text = None
        lyricstype = "NONE"
        if track.lyrics_info.has_available_sync_lyrics:
            lyrics_text = track.get_lyrics("LRC").fetch_lyrics()
            lyricstype = "LRC"

        elif track.lyrics_info.has_available_text_lyrics:
            lyrics_text = track.get_lyrics("TEXT").fetch_lyrics()
            lyricstype = "TEXT"

        # Возвращаем готовый объект для другого класса
        return DownloadedTrack(
            track_id=str(track.id),
            title=track.title,
            artist=", ".join([a.name for a in track.artists]),
            file_path=os.path.abspath(full_path),
            lyrics_type=lyricstype,
            lyrics=lyrics_text,
            cover_url=track.cover_uri.replace("%%", "200x200") if track.cover_uri else None,
            bitrate=best_quality.bitrate_in_kbps,
            format=best_quality.codec
        )