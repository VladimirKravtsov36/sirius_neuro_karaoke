import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KaraokeDisplay } from '../components/KaraokeDisplay';
import { ParametersMenu } from '../components/ParametersMenu';
import { ProgressBar } from '../components/ProgressBar';
import { RotatingSlideshow } from '../components/RotatingSlideshow';
import { AnimationParams } from '../types';
import { X } from 'lucide-react';

export default function Song() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackData } = location.state || {};

  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [mixValue, setMixValue] = useState(50);
  const [keyValue, setKeyValue] = useState(trackData?.analysis?.key || 0);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const [animationParams] = useState<AnimationParams>({
    ballBounceHeight: 20,
    ballBounceDuration: 0.6,
    ballRhythmOffset: 0,
    fillAnimationSpeed: 1.0,
    wordLingerDuration: 0.8,
    fadeOutDuration: 1.0,
    particleIntensity: 1.0,
    particleCount: 15,
  });

  if (!trackData) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-white">
        Нет данных для песни
      </div>
    );
  }

  const { track_info, downloads, karaokeData } = trackData;

  // Загружаем изображения с сервера
  useEffect(() => {
    if (!downloads?.images_url) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(downloads.images_url);
        const data = await res.json();
        // Ожидаем, что сервер вернёт { images: [...] }
        if (Array.isArray(data.images)) {
          setSlideshowImages(data.images);
        } else {
          console.error('Неверный формат данных с сервера:', data);
        }
      } catch (err) {
        console.error('Ошибка загрузки изображений:', err);
        setSlideshowImages([]);
      }
    };

    fetchImages();
  }, [downloads?.images_url]);

  // Определяем общую длительность песни
  const totalDuration =
    karaokeData?.length > 0
      ? karaokeData[karaokeData.length - 1].end
      : 12;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0B0F] text-white">
      {/* Крестик выхода */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
        title="Вернуться на главную"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Параметры слева */}
      <ParametersMenu
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(!isMenuOpen)}
        mixValue={mixValue}
        keyValue={keyValue}
        onMixChange={setMixValue}
        onKeyChange={setKeyValue}
      />

      {/* Караоке */}
      <div
        className={`absolute inset-0 bottom-20 transition-all duration-300 ${
          isMenuOpen ? 'md:left-80 left-0' : 'left-0'
        }`}
      >
        <KaraokeDisplay
          karaokeData={karaokeData}
          currentTime={currentTime}
          animationParams={animationParams}
          trackInfo={track_info}
        />
      </div>

      {/* Слайдшоу */}
      <div
        className={`absolute inset-0 bottom-20 flex items-center justify-center transition-all duration-300 ${
          isMenuOpen ? 'md:left-80 left-0' : 'left-0'
        }`}
      >
        <div className="w-[90vw] max-w-4xl h-[50vh] max-h-[600px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
          {slideshowImages.length > 0 && (
            <RotatingSlideshow images={slideshowImages} duration={12} />
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          isMenuOpen ? 'md:left-80' : 'left-0'
        }`}
      >
        <ProgressBar
          currentTime={currentTime}
          totalDuration={totalDuration}
          onSeek={setCurrentTime}
        />
      </div>
    </div>
  );
}
