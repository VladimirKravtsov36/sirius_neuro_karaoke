import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ParticleEffect } from './ParticleEffect';
import { AnimationParams, Word, KaraokeLine } from '../types';

interface TrackInfo {
  title: string;
  artist: string;
  coverUrl: string;
}

interface KaraokeDisplayProps {
  karaokeData: KaraokeLine[];
  currentTime: number;
  animationParams?: AnimationParams;
  trackInfo: TrackInfo;
}

interface WordPosition {
  x: number;
  y: number;
}

const DEFAULT_ANIMATION_PARAMS: AnimationParams = {
  ballBounceHeight: 20,
  ballBounceDuration: 0.6,
  fillAnimationSpeed: 1.0,
  wordLingerDuration: 0.8,
  fadeOutDuration: 1.0,
  particleIntensity: 1.0,
  particleCount: 15,
};

const TrackHeader = ({ trackInfo }: { trackInfo: TrackInfo }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="relative z-20 flex flex-col md:flex-row items-center gap-4 p-6 max-w-full"
  >
    <div className="relative group flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
      <img
        src={trackInfo.coverUrl}
        alt={trackInfo.title}
        className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl shadow-2xl border-2 border-white/10 object-cover"
        loading="lazy"
      />
    </div>

    <div className="flex flex-col items-center md:items-start text-center md:text-left mt-4 md:mt-0 min-w-0">
      <h1 className="font-bold text-2xl md:text-3xl text-white leading-tight truncate">
        {trackInfo.title}
      </h1>
      <p className="text-gray-300 text-lg mt-1 truncate">{trackInfo.artist}</p>
    </div>
  </motion.div>
);

const BackgroundEffects = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob"></div>
    <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
  </div>
);

const NoLyricsPlaceholder = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center text-gray-400 text-xl py-12"
  >
    ♪ Music playing... ♪
  </motion.div>
);

const WordElement = ({
  word,
  index,
  currentWordIndex,
  currentTime,
  wordLingerDuration,
  fadeOutDuration,
  onPositionUpdate,
  wordId
}: {
  word: Word;
  index: number;
  currentWordIndex: number;
  currentTime: number;
  wordLingerDuration: number;
  fadeOutDuration: number;
  onPositionUpdate: (position: WordPosition) => void;
  wordId: string;
}) => {
  const wordRef = useRef<HTMLDivElement>(null);
  const isCurrent = index === currentWordIndex;
  const shouldFadeOut = currentTime > word.end + wordLingerDuration;
  const fillPercentage = useMemo(() => {
    if (currentTime < word.start) return 0;
    if (currentTime > word.end) return 100;
    return Math.min(100, ((currentTime - word.start) / (word.end - word.start)) * 100);
  }, [currentTime, word]);

  // Отслеживание позиции слова для эффектов частиц
  useEffect(() => {
    if (wordRef.current) {
      const rect = wordRef.current.getBoundingClientRect();
      onPositionUpdate({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [onPositionUpdate]);

  return (
    <div
      ref={wordRef}
      key={wordId}
      className="relative group min-w-max px-1"
    >
      <motion.div
        animate={{
          scale: isCurrent ? 1.05 : 1,
          opacity: shouldFadeOut ? 0 : 1,
          y: shouldFadeOut ? -20 : 0,
        }}
        transition={{ 
          duration: shouldFadeOut ? fadeOutDuration : 0.2,
          ease: "easeOut"
        }}
      >
        <div className="relative text-3xl md:text-4xl lg:text-5xl font-bold py-2">
          {/* Незаполненный текст */}
          <span
            className="relative z-0 text-transparent bg-clip-text bg-gradient-to-r from-gray-500/70 to-gray-600/70"
            style={{ opacity: Math.max(0.3, word.score || 0.5) }}
          >
            {word.word}
          </span>

          {/* Заполненный текст */}
          <span
            className="absolute top-0 left-0 z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 overflow-hidden"
            style={{ width: `${fillPercentage}%` }}
          >
            {word.word}
          </span>

          {/* Эффект свечения для текущего слова */}
          {isCurrent && (
            <motion.div
              className="absolute inset-0 -z-10 blur-xl opacity-70"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                {word.word}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ParticlesContainer = ({ completedWords, params }: { 
  completedWords: Array<{ id: string; x: number; y: number }>;
  params: AnimationParams;
}) => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <AnimatePresence>
      {completedWords.map((word) => (
        <ParticleEffect
          key={word.id}
          x={word.x}
          y={word.y}
          intensity={params.particleIntensity}
          count={params.particleCount}
          duration={params.fadeOutDuration}
        />
      ))}
    </AnimatePresence>
  </div>
);

export function KaraokeDisplay({ 
  karaokeData, 
  currentTime, 
  animationParams, 
  trackInfo 
}: KaraokeDisplayProps) {
  const [completedWords, setCompletedWords] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const wordPositionsRef = useRef<Map<string, WordPosition>>(new Map());
  const completedWordIdsRef = useRef<Set<string>>(new Set());
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrolledWordIndexRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Время предварительного появления строки и прокрутки (в секундах)
  const PREVIEW_TIME = 2.0; // Увеличено для более раннего появления

  // Безопасное управление жизненным циклом компонента
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Сброс состояний при смене трека
  useEffect(() => {
    wordPositionsRef.current.clear();
    completedWordIdsRef.current.clear();
    setCompletedWords([]);
    lastScrolledWordIndexRef.current = null;
  }, [trackInfo.coverUrl]);

  // Объединение параметров анимации с значениями по умолчанию
  const params = useMemo(() => ({
    ...DEFAULT_ANIMATION_PARAMS,
    ...animationParams
  }), [animationParams]);

  // Поиск текущей строки и слова с мемоизацией
  const { currentLine, currentWordIndex } = useMemo(() => {
    // Находим строку, которая будет активной или уже активна
    // Увеличиваем время предварительного появления
    const line = karaokeData.find(
      (l) => currentTime >= (l.start - PREVIEW_TIME) && currentTime <= l.end
    );
    
    const wordIndex = line 
      ? line.words.findIndex(w => currentTime >= w.start && currentTime <= w.end)
      : -1;
      
    return { currentLine: line, currentWordIndex: wordIndex };
  }, [karaokeData, currentTime, PREVIEW_TIME]);

  // Обновление списка завершенных слов
  useEffect(() => {
    if (!currentLine) return;
    
    const cleanupTimeouts: NodeJS.Timeout[] = [];

    // Находим индекс текущей строки в массиве karaokeData
    const currentLineIndex = karaokeData.findIndex(
      l => l.start === currentLine.start && l.end === currentLine.end
    );
    
    if (currentLineIndex === -1) return;

    currentLine.words.forEach((word, wordIndex) => {
      // Создаем уникальный ID слова
      const wordId = `${currentLine.start}-${currentLineIndex}-${wordIndex}`;
      
      if (currentTime > word.end + params.wordLingerDuration) {
        if (!completedWordIdsRef.current.has(wordId)) {
          completedWordIdsRef.current.add(wordId);
          
          const position = wordPositionsRef.current.get(wordId) || { 
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          };
          
          setCompletedWords(prev => [
            ...prev,
            { id: wordId, ...position }
          ]);

          const timeout = setTimeout(() => {
            if (isMountedRef.current) {
              setCompletedWords(prev => prev.filter(w => w.id !== wordId));
              completedWordIdsRef.current.delete(wordId);
            }
          }, params.fadeOutDuration * 1000 + 100);
          
          cleanupTimeouts.push(timeout);
        }
      } else if (completedWordIdsRef.current.has(wordId)) {
        // Если слово снова стало активным, убираем его из завершенных
        completedWordIdsRef.current.delete(wordId);
      }
    });

    return () => cleanupTimeouts.forEach(clearTimeout);
  }, [currentTime, currentLine, karaokeData, params.wordLingerDuration, params.fadeOutDuration, isMountedRef]);

  // Обработка позиции слова для эффектов частиц
  const handleWordPositionUpdate = useCallback((wordId: string, position: WordPosition) => {
    wordPositionsRef.current.set(wordId, position);
  }, []);

  // Автоматическая прокрутка к текущему слову
  useEffect(() => {
    if (currentWordIndex === -1 || !wordsContainerRef.current || !containerRef.current || !currentLine) return;
    
    // Прокручиваем только при смене слова для оптимизации
    if (lastScrolledWordIndexRef.current === currentWordIndex) return;
    lastScrolledWordIndexRef.current = currentWordIndex;

    const container = containerRef.current;
    const wordElements = wordsContainerRef.current.children;
    
    if (currentWordIndex >= wordElements.length) return;
    
    const currentWordElement = wordElements[currentWordIndex] as HTMLElement;
    if (!currentWordElement) return;
    
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      
      const containerRect = container.getBoundingClientRect();
      const wordRect = currentWordElement.getBoundingClientRect();
      
      // Проверяем видимость с отступами
      const isWordVisible = (
        wordRect.left >= containerRect.left - 100 &&
        wordRect.right <= containerRect.right + 100
      );
      
      if (!isWordVisible) {
        const wordCenter = wordRect.left + wordRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const containerScrollLeft = container.scrollLeft;
        
        const scrollOffset = wordCenter - containerCenter;
        const newScrollLeft = containerScrollLeft + scrollOffset;
        
        container.scrollTo({
          left: newScrollLeft,
          behavior: 'smooth'
        });
      }
    });
  }, [currentWordIndex, currentLine]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Заголовок с информацией о треке */}
      <TrackHeader trackInfo={trackInfo} />
      
      {/* Фоновые эффекты */}
      <BackgroundEffects />

      {/* Пустое пространство для центрирования караоке внизу */}
      <div className="flex-1 min-h-0"></div>

      {/* Основной контент караоке */}
      <div className="relative z-10 w-full px-4 pb-12">
        <AnimatePresence mode="wait">
          {currentLine ? (
            <motion.div
              key={currentLine.start}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Контейнер с прокруткой для длинных строк */}
              <div 
                ref={containerRef}
                className="relative overflow-x-auto scrollbar-hide px-2 py-2"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div 
                  ref={wordsContainerRef}
                  className="flex flex-nowrap justify-center items-end gap-2 md:gap-3 min-w-max py-2"
                >
                  {currentLine.words.map((word, index) => {
                    // Формируем уникальный ID слова
                    const wordId = `${currentLine.start}-${karaokeData.findIndex(l => l.start === currentLine.start && l.end === currentLine.end)}-${index}`;
                    return (
                      <WordElement
                        key={wordId}
                        word={word}
                        index={index}
                        currentWordIndex={currentWordIndex}
                        currentTime={currentTime}
                        wordLingerDuration={params.wordLingerDuration}
                        fadeOutDuration={params.fadeOutDuration}
                        wordId={wordId}
                        onPositionUpdate={(position) => 
                          handleWordPositionUpdate(wordId, position)
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <NoLyricsPlaceholder key="no-lyrics" />
          )}
        </AnimatePresence>
      </div>

      {/* Эффекты частиц для завершенных слов */}
      <ParticlesContainer 
        completedWords={completedWords} 
        params={params} 
      />
    </div>
  );
}