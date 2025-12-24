import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [keyValue, setKeyValue] = useState<number>(
    typeof trackData?.analysis?.key === 'number' ? trackData.analysis.key : 0
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentalBufferRef = useRef<AudioBuffer | null>(null);
  const vocalsBufferRef = useRef<AudioBuffer | null>(null);
  const currentInstrumentalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentVocalsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const instrumentalGainRef = useRef<GainNode | null>(null);
  const vocalsGainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // --- useRef для отслеживания предыдущего trackId ---
  const previousTrackIdRef = useRef<string | number | undefined>(undefined);

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
  const trackId = track_info?.id;
  const totalDuration =
    karaokeData?.length > 0
      ? karaokeData[karaokeData.length - 1].end
      : 12;

  // --- useEffect для инициализации AudioContext и гейнов ---
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const instrumentalGain = ctx.createGain();
    const vocalsGain = ctx.createGain();
    instrumentalGain.connect(ctx.destination);
    vocalsGain.connect(ctx.destination);

    instrumentalGainRef.current = instrumentalGain;
    vocalsGainRef.current = vocalsGain;

    return () => {
      if (currentInstrumentalSourceRef.current) {
        try { currentInstrumentalSourceRef.current.stop(); } catch {}
        currentInstrumentalSourceRef.current.disconnect();
        currentInstrumentalSourceRef.current = null;
      }
      if (currentVocalsSourceRef.current) {
        try { currentVocalsSourceRef.current.stop(); } catch {}
        currentVocalsSourceRef.current.disconnect();
        currentVocalsSourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        instrumentalGainRef.current = null;
        vocalsGainRef.current = null;
      }
    };
  }, []); // Сработает только при монтировании

  // --- useEffect для загрузки буферов (оптимизирован) ---
  useEffect(() => {
    // Проверяем, изменился ли trackId
    if (trackId !== previousTrackIdRef.current) {
      // console.log("Song.tsx: trackId изменился, запускаем загрузку буферов для:", trackId);

      // Запоминаем новый trackId
      previousTrackIdRef.current = trackId;

      // Определяем функцию загрузки внутри эффекта
      const loadAndSetupBuffers = async (currentId: string | number) => {
        // Проверка: жив ли контекст
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          console.error("Song.tsx: AudioContext закрыт при попытке загрузки буферов.");
          return;
        }

        const ctx = audioContextRef.current;

        // Очищаем старые буферы
        instrumentalBufferRef.current = null;
        vocalsBufferRef.current = null;

        // Создаем объект отмены для fetch (опционально, но безопасно)
        const abortController = new AbortController();

        try {
          if (downloads?.instrumental_url) {
            // console.log("Song.tsx: Загрузка instrumental с URL:", downloads.instrumental_url);
            const instrumentalResponse = await fetch(downloads.instrumental_url, { signal: abortController.signal });
            if (!instrumentalResponse.ok) {
              throw new Error(`HTTP error! status: ${instrumentalResponse.status}`);
            }
            const instrumentalArrayBuffer = await instrumentalResponse.arrayBuffer();
            const instrumentalBuffer = await ctx.decodeAudioData(instrumentalArrayBuffer);

            // Проверка снова перед сохранением (вдруг trackId снова изменился к моменту декодирования)
            if (currentId === previousTrackIdRef.current) {
              instrumentalBufferRef.current = instrumentalBuffer;
              // console.log("Song.tsx: instrumentalBuffer сохранен в ref");
            } else {
              // console.log("Song.tsx: trackId изменился во время загрузки instrumental, пропускаем сохранение.");
            }
          }

          if (downloads?.vocals_url) {
            // console.log("Song.tsx: Загрузка vocals с URL:", downloads.vocals_url);
            const vocalsResponse = await fetch(downloads.vocals_url, { signal: abortController.signal });
            if (!vocalsResponse.ok) {
              throw new Error(`HTTP error! status: ${vocalsResponse.status}`);
            }
            const vocalsArrayBuffer = await vocalsResponse.arrayBuffer();
            const vocalsBuffer = await ctx.decodeAudioData(vocalsArrayBuffer);

            if (currentId === previousTrackIdRef.current) {
              vocalsBufferRef.current = vocalsBuffer;
              // console.log("Song.tsx: vocalsBuffer сохранен в ref");
            } else {
              // console.log("Song.tsx: trackId изменился во время загрузки vocals, пропускаем сохранение.");
            }
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            // console.log("Song.tsx: Загрузка отменена из-за смены трека.");
          } else {
            console.error("Song.tsx: Ошибка загрузки/декодирования аудио:", e);
          }
        }
      };

      if (trackId && (downloads?.instrumental_url || downloads?.vocals_url)) {
        loadAndSetupBuffers(trackId);
      } else {
        // console.log("Song.tsx: URL для аудио недоступны или currentTrackId отсутствует, пропускаем загрузку.");
      }
    }
    // Зависимости: только trackId и downloads, чтобы не срабатывать при изменении других свойств trackData
  }, [trackId, downloads?.instrumental_url, downloads?.vocals_url]);

  const startPlayback = useCallback(async () => {
    // console.log("Song.tsx: Вызов startPlayback. isPlayingRef.current:", isPlayingRef.current);
    if (!audioContextRef.current) {
        console.error("Song.tsx: AudioContext не инициализирован");
        return;
    }

    if (!instrumentalBufferRef.current && !vocalsBufferRef.current) {
        console.error("Song.tsx: Нет доступных аудиобуферов для воспроизведения");
        return;
    }

    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    const offset = pausedAtRef.current;
    startTimeRef.current = ctx.currentTime - offset;

    // Останавливаем текущие источники, если они есть
    if (currentInstrumentalSourceRef.current) {
        try { currentInstrumentalSourceRef.current.stop(); } catch {}
        currentInstrumentalSourceRef.current.disconnect();
        currentInstrumentalSourceRef.current = null;
    }
    if (currentVocalsSourceRef.current) {
        try { currentVocalsSourceRef.current.stop(); } catch {}
        currentVocalsSourceRef.current.disconnect();
        currentVocalsSourceRef.current = null;
    }

    // Создаем и запускаем новые источники
    if (instrumentalBufferRef.current) {
        const newInstrumentalSource = ctx.createBufferSource();
        newInstrumentalSource.buffer = instrumentalBufferRef.current;
        newInstrumentalSource.loop = true;
        newInstrumentalSource.connect(instrumentalGainRef.current!);
        newInstrumentalSource.start(0, offset % newInstrumentalSource.buffer.duration);
        currentInstrumentalSourceRef.current = newInstrumentalSource;
    }

    if (vocalsBufferRef.current) {
        const newVocalsSource = ctx.createBufferSource();
        newVocalsSource.buffer = vocalsBufferRef.current;
        newVocalsSource.loop = true;
        newVocalsSource.connect(vocalsGainRef.current!);
        newVocalsSource.start(0, offset % newVocalsSource.buffer.duration);
        currentVocalsSourceRef.current = newVocalsSource;
    }

    isPlayingRef.current = true;
    setIsAudioPlaying(true);
  }, []);

  const pausePlayback = useCallback(() => {
    // console.log("Song.tsx: Вызов pausePlayback. isPlayingRef.current:", isPlayingRef.current);
    if (!audioContextRef.current || !isPlayingRef.current) return;

    const ctx = audioContextRef.current;
    pausedAtRef.current = ctx.currentTime - startTimeRef.current;

    if (currentInstrumentalSourceRef.current) {
        try { currentInstrumentalSourceRef.current.stop(); } catch {}
        currentInstrumentalSourceRef.current.disconnect();
        currentInstrumentalSourceRef.current = null;
    }

    if (currentVocalsSourceRef.current) {
        try { currentVocalsSourceRef.current.stop(); } catch {}
        currentVocalsSourceRef.current.disconnect();
        currentVocalsSourceRef.current = null;
    }

    isPlayingRef.current = false;
    setIsAudioPlaying(false);
  }, []);

  const seekAudio = useCallback((newTime: number) => {
    // console.log("Song.tsx: Вызов seekAudio к времени:", newTime);
    if (!audioContextRef.current) {
        console.error("Song.tsx: AudioContext не инициализирован при перемотке");
        return;
    }

    const wasPlaying = isPlayingRef.current;
    if (wasPlaying) {
        pausePlayback();
    }

    pausedAtRef.current = newTime;

    if (wasPlaying) {
        startPlayback();
    }
    setCurrentTime(newTime);
  }, [pausePlayback, startPlayback]);

  useEffect(() => {
    if (instrumentalGainRef.current && vocalsGainRef.current) {
      const instrumentalLevel = 1.0;
      const vocalsLevel = mixValue / 100;

      const ctx = audioContextRef.current;
      if (ctx) {
        instrumentalGainRef.current.gain.setValueAtTime(instrumentalLevel, ctx.currentTime);
        vocalsGainRef.current.gain.setValueAtTime(vocalsLevel, ctx.currentTime);
      }
    }
  }, [mixValue]);

  // --- useEffect для обновления времени (оптимизирован) ---
  useEffect(() => {
    if (!isPlayingRef.current || !audioContextRef.current) {
        return;
    }

    let animationFrameId: number;

    const updateTime = () => {
      if (isPlayingRef.current && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const cappedTime = Math.min(elapsed, totalDuration);
        setCurrentTime(cappedTime);

        if (elapsed >= totalDuration && totalDuration > 0) {
            // console.log("Song.tsx: Достигнут конец трека, останавливаем воспроизведение");
            pausePlayback();
            setCurrentTime(totalDuration);
        } else {
             animationFrameId = requestAnimationFrame(updateTime);
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // Зависимости: только isPlayingRef.current и totalDuration
  }, [isPlayingRef.current, totalDuration, pausePlayback]); // Добавлен pausePlayback в зависимости, т.к. она вызывается внутри

  useEffect(() => {
    if (!downloads?.images_url) return;

    const fetchImages = async () => {
      try {
        const res = await fetch(downloads.images_url);
        const data = await res.json();
        if (Array.isArray(data.images)) {
          setSlideshowImages(data.images);
        } else {
          console.error('Song.tsx: Неверный формат данных с сервера:', data);
        }
      } catch (err) {
        console.error('Song.tsx: Ошибка загрузки изображений:', err);
        setSlideshowImages([]);
      }
    };

    fetchImages();
  }, [downloads?.images_url]);

  // Обернутые в useCallback обработчики
  const handlePlayPauseToggle = useCallback(() => {
    // console.log("Song.tsx: Кнопка Play/Pause нажата. Текущее состояние isPlaying:", isAudioPlaying);
    if (isPlayingRef.current) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }, [isPlayingRef.current, pausePlayback, startPlayback]);

  const handleSeek = useCallback((time: number) => {
    // console.log("Song.tsx: Перемотка к времени:", time);
    seekAudio(time);
  }, [seekAudio]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0B0F] text-white">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
        title="Вернуться на главную"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <ParametersMenu
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(!isMenuOpen)}
        mixValue={mixValue}
        keyValue={keyValue}
        onMixChange={setMixValue}
        onKeyChange={setKeyValue}
      />

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

      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          isMenuOpen ? 'md:left-80' : 'left-0'
        }`}
      >
        <ProgressBar
          currentTime={currentTime}
          totalDuration={totalDuration}
          isPlaying={isAudioPlaying}
          onSeek={handleSeek}
          onPlayPauseToggle={handlePlayPauseToggle}
        />
      </div>
    </div>
  );
}