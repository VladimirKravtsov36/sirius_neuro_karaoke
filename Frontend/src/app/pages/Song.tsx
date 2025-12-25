import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KaraokeDisplay } from '../components/KaraokeDisplay';
import { ParametersMenu } from '../components/ParametersMenu';
import { ProgressBar } from '../components/ProgressBar';
import { RotatingSlideshow } from '../components/RotatingSlideshow';
import { AnimationParams } from '../types';
import { X } from 'lucide-react';

// --- Функция преобразования полутона в pitch factor ---
const semitonesToPitchFactor = (semitones: number): number => {
  return Math.pow(2, semitones / 12);
};

export default function Song() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackData } = location.state || {};

  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [mixValue, setMixValue] = useState(50);
  // --- Изменено: keyValue теперь число, по умолчанию 0 ---
  const [keyValue, setKeyValue] = useState<number>(0);

  // --- Переносим все refs внутрь компонента ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentalBufferRef = useRef<AudioBuffer | null>(null);
  const vocalsBufferRef = useRef<AudioBuffer | null>(null);
  const currentInstrumentalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentVocalsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const instrumentalGainRef = useRef<GainNode | null>(null);
  const vocalsGainRef = useRef<GainNode | null>(null);
  // --- Добавлено: Refs для AudioWorklet и параметра ---
  const pitchShifterNodeRef = useRef<AudioWorkletNode | null>(null);
  const pitchParamRef = useRef<AudioParam | null>(null);

  const isPlayingRef = useRef(false);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  // --- Добавлено: Состояние для проверки поддержки Worklet ---
  const [audioWorkletSupported, setAudioWorkletSupported] = useState(false);
  // --- Добавлено: Состояние для проверки инициализации аудио ---
  const [audioInitialized, setAudioInitialized] = useState(false);
  // --- Добавлено: Состояние для отображения необходимости взаимодействия ---
  const [requiresUserGesture, setRequiresUserGesture] = useState(true); // По умолчанию true

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

  // --- useEffect для инициализации аудио при взаимодействии пользователя ---
  useEffect(() => {
    // Функция инициализации аудио после создания/восстановления контекста
    const initializeAudioAfterCreation = async (context: AudioContext) => {
      // Проверяем поддержку AudioWorklet
      const isSupported = context.audioWorklet !== undefined;
      setAudioWorkletSupported(isSupported);
      
      if (!isSupported) {
        console.warn("Song.tsx: AudioWorklet API не поддерживается. Pitch shifting будет отключен.");
        // Инициализируем обычный контекст и гейны
        audioContextRef.current = context;

        const instrumentalGain = context.createGain();
        const vocalsGain = context.createGain();
        instrumentalGain.connect(context.destination);
        vocalsGain.connect(context.destination);

        instrumentalGainRef.current = instrumentalGain;
        vocalsGainRef.current = vocalsGain;
        
        setAudioInitialized(true);
        return;
      }

      try {
        // --- Загрузка AudioWorklet модуля ---
        await context.audioWorklet.addModule('./phase-vocoder.js');
        console.log("Song.tsx: AudioWorklet модуль загружен.");

        const pitchShifterNode = new AudioWorkletNode(context, 'phase-vocoder-processor');
        pitchShifterNodeRef.current = pitchShifterNode;

        // Предполагаем, что параметр называется 'pitchFactor', как в примере
        const pitchParam = pitchShifterNode.parameters.get('pitchFactor');
        if (pitchParam) {
          pitchParamRef.current = pitchParam;
          console.log("Song.tsx: AudioParam 'pitchFactor' получен.");
          // --- Установка начального значения pitch после инициализации ---
          const initialPitchFactor = semitonesToPitchFactor(keyValue);
          const clampedFactor = Math.max(0.5, Math.min(1.5, initialPitchFactor));
          pitchParamRef.current.value = clampedFactor;
          console.log(`Song.tsx: Установлен начальный pitchFactor: ${clampedFactor} для keyValue (semitones): ${keyValue}`);
        } else {
          console.error("Song.tsx: Не удалось получить AudioParam 'pitchFactor'. Проверьте имя параметра в библиотеке phaze.");
          // Резервный режим: подключаем напрямую к destination
          pitchShifterNode.connect(context.destination);
        }

        const instrumentalGain = context.createGain();
        const vocalsGain = context.createGain();
        instrumentalGain.connect(pitchShifterNode);
        vocalsGain.connect(pitchShifterNode);
        if (pitchParam) {
          pitchShifterNode.connect(context.destination);
        } else {
          // Резервный режим: подключаем напрямую к destination
          instrumentalGain.connect(context.destination);
          vocalsGain.connect(context.destination);
        }

        audioContextRef.current = context;
        instrumentalGainRef.current = instrumentalGain;
        vocalsGainRef.current = vocalsGain;
        
        setAudioInitialized(true);

      } catch (err) {
        console.error("Song.tsx: Ошибка инициализации AudioWorklet:", err);
        // Резервный режим: инициализация без Worklet при ошибке
        setAudioWorkletSupported(false); // Отключаем поддержку при ошибке

        // Используем существующий контекст
        audioContextRef.current = context;

        const instrumentalGain = context.createGain();
        const vocalsGain = context.createGain();
        instrumentalGain.connect(context.destination);
        vocalsGain.connect(context.destination);

        instrumentalGainRef.current = instrumentalGain;
        vocalsGainRef.current = vocalsGain;
        
        setAudioInitialized(true);
      }
    };

    // Функция для резюмирования и инициализации при взаимодействии пользователя
    const handleUserGesture = async () => {
      if (audioInitialized || !requiresUserGesture) return; // Уже инициализировано или не требуется

      // Проверяем, есть ли уже активный контекст (редко, но возможно)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // Если контекст уже есть, просто возобновляем его
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log("Song.tsx: Существующий AudioContext resumed после жеста пользователя.");
        }
        setRequiresUserGesture(false);
        setAudioInitialized(true);
        return;
      }

      // Создаем новый контекст при жесте пользователя
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.error("Song.tsx: AudioContext не поддерживается в этом браузере.");
        return;
      }
      
      const ctx = new AudioContext();
      console.log("Song.tsx: AudioContext создан по жесту пользователя.");

      // Проверяем, запущен ли контекст (в идеале после жеста он запущен)
      if (ctx.state === 'suspended') {
        console.log("Song.tsx: AudioContext все еще suspended, вызываем resume...");
        await ctx.resume();
        console.log("Song.tsx: AudioContext resumed после жеста пользователя.");
      }

      setRequiresUserGesture(false); // Убираем флаг необходимости жеста
      await initializeAudioAfterCreation(ctx);
    };

    // Добавляем слушатель к любому элементу, например, к документу
    // В реальном приложении это может быть конкретная кнопка
    document.addEventListener('click', handleUserGesture, { once: true });
    document.addEventListener('touchstart', handleUserGesture, { once: true });

    return () => {
      // Удаляем слушатели
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('touchstart', handleUserGesture);
    };
  }, [audioInitialized, requiresUserGesture, keyValue]); // Добавляем зависимости

  // --- useEffect для загрузки буферов (оптимизирован) ---
  useEffect(() => {
    // NEW: Wait for audio initialization before proceeding
    if (!audioInitialized) return;

    // Проверяем, изменился ли trackId
    if (trackId !== previousTrackIdRef.current) {
      console.log("Song.tsx: trackId изменился, запускаем загрузку буферов для:", trackId);

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
            console.log("Song.tsx: Загрузка instrumental с URL:", downloads.instrumental_url);
            const instrumentalResponse = await fetch(downloads.instrumental_url, { signal: abortController.signal });
            if (!instrumentalResponse.ok) {
              throw new Error(`HTTP error! status: ${instrumentalResponse.status}`);
            }
            const instrumentalArrayBuffer = await instrumentalResponse.arrayBuffer();
            const instrumentalBuffer = await ctx.decodeAudioData(instrumentalArrayBuffer);

            // Проверка снова перед сохранением (вдруг trackId снова изменился к моменту декодирования)
            if (currentId === previousTrackIdRef.current) {
              instrumentalBufferRef.current = instrumentalBuffer;
              console.log("Song.tsx: instrumentalBuffer сохранен в ref");
            } else {
              console.log("Song.tsx: trackId изменился во время загрузки instrumental, пропускаем сохранение.");
            }
          }

          if (downloads?.vocals_url) {
            console.log("Song.tsx: Загрузка vocals с URL:", downloads.vocals_url);
            const vocalsResponse = await fetch(downloads.vocals_url, { signal: abortController.signal });
            if (!vocalsResponse.ok) {
              throw new Error(`HTTP error! status: ${vocalsResponse.status}`);
            }
            const vocalsArrayBuffer = await vocalsResponse.arrayBuffer();
            const vocalsBuffer = await ctx.decodeAudioData(vocalsArrayBuffer);

            if (currentId === previousTrackIdRef.current) {
              vocalsBufferRef.current = vocalsBuffer;
              console.log("Song.tsx: vocalsBuffer сохранен в ref");
            } else {
              console.log("Song.tsx: trackId изменился во время загрузки vocals, пропускаем сохранение.");
            }
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            console.log("Song.tsx: Загрузка отменена из-за смены трека.");
          } else {
            console.error("Song.tsx: Ошибка загрузки/декодирования аудио:", e);
          }
        }
      };

      if (trackId && (downloads?.instrumental_url || downloads?.vocals_url)) {
        loadAndSetupBuffers(trackId);
      } else {
        console.log("Song.tsx: URL для аудио недоступны или currentTrackId отсутствует, пропускаем загрузку.");
      }
    }
    // NEW: Add audioInitialized to dependencies
  }, [trackId, downloads?.instrumental_url, downloads?.vocals_url, audioInitialized]);

  // --- useEffect для обновления гейнов и pitch ---
  useEffect(() => {
    if (!audioInitialized) return; // NEW: Ensure audio is initialized before updating gains/pitch

    if (instrumentalGainRef.current && vocalsGainRef.current) {
      const instrumentalLevel = 1.0;
      const vocalsLevel = mixValue / 100;

      const ctx = audioContextRef.current;
      if (ctx) {
        instrumentalGainRef.current.gain.setValueAtTime(instrumentalLevel, ctx.currentTime);
        vocalsGainRef.current.gain.setValueAtTime(vocalsLevel, ctx.currentTime);
      }
    }

    // --- Обновление pitch ---
    if (pitchParamRef.current) {
      // keyValue - это число полутона
      const pitchFactor = semitonesToPitchFactor(keyValue);
      // Ограничиваем диапазон pitch factor, например, от 0.5 до 1.5 (может потребоваться корректировка)
      const clampedFactor = Math.max(0.5, Math.min(1.5, pitchFactor));
      pitchParamRef.current.value = clampedFactor;
      console.log(`Song.tsx: Установлен pitchFactor: ${clampedFactor} для keyValue (semitones): ${keyValue}`);
    }
  }, [mixValue, keyValue, audioInitialized]); // NEW: Add audioInitialized to dependencies


  const startPlayback = useCallback(async () => {
    // NEW: Ensure audio is initialized before playback
    if (!audioInitialized) {
      console.error("Song.tsx: Audio system not initialized yet");
      return;
    }

    console.log("Song.tsx: Вызов startPlayback. isPlayingRef.current:", isPlayingRef.current);
    if (!audioContextRef.current) {
        console.error("Song.tsx: AudioContext не инициализирован");
        return;
    }

    if (!instrumentalBufferRef.current && !vocalsBufferRef.current) {
        console.error("Song.tsx: Нет доступных аудиобуферов для воспроизведения");
        return;
    }

    const ctx = audioContextRef.current;

    // Проверяем, запущен ли контекст, и если нет - пробуем возобновить
    if (ctx.state === 'suspended') {
      console.warn("Song.tsx: AudioContext suspended before playback. Attempting resume...");
      try {
        await ctx.resume();
        console.log("Song.tsx: AudioContext resumed successfully before playback.");
      } catch (e) {
        console.error("Song.tsx: Failed to resume AudioContext:", e);
        return; // Не продолжаем воспроизведение, если не удалось возобновить
      }
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
        // NEW: Connect to the gain node that belongs to the same context
        if(instrumentalGainRef.current) {
          newInstrumentalSource.connect(instrumentalGainRef.current);
        } else {
          console.error("Song.tsx: instrumentalGainRef.current is null, cannot connect source.");
          return;
        }
        newInstrumentalSource.start(0, offset % newInstrumentalSource.buffer.duration);
        currentInstrumentalSourceRef.current = newInstrumentalSource;
    }

    if (vocalsBufferRef.current) {
        const newVocalsSource = ctx.createBufferSource();
        newVocalsSource.buffer = vocalsBufferRef.current;
        newVocalsSource.loop = true;
        // NEW: Connect to the gain node that belongs to the same context
        if(vocalsGainRef.current) {
          newVocalsSource.connect(vocalsGainRef.current);
        } else {
          console.error("Song.tsx: vocalsGainRef.current is null, cannot connect source.");
          return;
        }
        newVocalsSource.start(0, offset % newVocalsSource.buffer.duration);
        currentVocalsSourceRef.current = newVocalsSource;
    }

    isPlayingRef.current = true;
    setIsAudioPlaying(true);
  }, [audioInitialized]); // NEW: Add audioInitialized to dependencies

  const pausePlayback = useCallback(() => {
    console.log("Song.tsx: Вызов pausePlayback. isPlayingRef.current:", isPlayingRef.current);
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
    console.log("Song.tsx: Вызов seekAudio к времени:", newTime);
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
            console.log("Song.tsx: Достигнут конец трека, останавливаем воспроизведение");
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
        const res = await fetch(`/images?track_folder=${encodeURIComponent(downloads.images_url)}`);
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
    console.log("Song.tsx: Кнопка Play/Pause нажата. Текущее состояние isPlaying:", isAudioPlaying);
    if (isPlayingRef.current) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }, [isPlayingRef.current, pausePlayback, startPlayback]);

  const handleSeek = useCallback((time: number) => {
    console.log("Song.tsx: Перемотка к времени:", time);
    seekAudio(time);
  }, [seekAudio]);

  // NEW: Show gesture required state until user interacts
  if (requiresUserGesture) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-white bg-[#0B0B0F]">
        <div className="text-center">
          <div className="text-xl mb-4">Для воспроизведения нажмите в любом месте экрана</div>
          <div className="animate-pulse text-gray-400">Кликните или коснитесь для запуска аудио</div>
        </div>
      </div>
    );
  }

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
        keyValue={keyValue} // Передаём число полутона
        onMixChange={setMixValue}
        onKeyChange={audioWorkletSupported ? setKeyValue : () => {}} // Передаём setKeyValue или пустую функцию
        keyDisabled={!audioWorkletSupported}
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