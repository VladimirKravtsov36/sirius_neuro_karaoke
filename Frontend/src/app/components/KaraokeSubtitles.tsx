import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

const lyrics = [
  { 
    text: "Here comes the sun", 
    words: ["Here", "comes", "the", "sun"] 
  },
  { 
    text: "世界に一つだけの花", 
    words: ["世界に", "一つだけの", "花"] 
  },
  { 
    text: "Большие города", 
    words: ["Большие", "города"] 
  },
  { 
    text: "Je ne regrette rien", 
    words: ["Je", "ne", "regrette", "rien"] 
  },
];

export function KaraokeSubtitles() {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const line = lyrics[currentLine];
    const wordDuration = 500;

    if (currentWord < line.words.length) {
      const timer = setTimeout(() => setCurrentWord(currentWord + 1), wordDuration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLine((currentLine + 1) % lyrics.length);
        setCurrentWord(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentLine, currentWord]);

  const line = lyrics[currentLine];

  // Адаптивные размеры для блока субтитров
  const subtitleHeight = {
    base: '3.5rem', // маленький экран
    sm: '5rem',     // средний
    lg: '6rem',     // большой
    xl: '7rem',     // очень большой
  };

  const visualHeight = {
    base: '3rem',
    sm: '4rem',
    lg: '5rem',
    xl: '6rem',
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0B0B0F] via-[#1A1A24] to-[#0B0B0F] rounded-2xl sm:rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
      {/* Glow фон */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative h-full flex flex-col">

        {/* Верхняя панель */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/50 flex items-center gap-2 sm:gap-3">
          <div className="flex gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="flex-1 text-center text-xs sm:text-sm text-gray-500">Now Playing</div>
        </div>

        {/* Центральная область */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-8 sm:py-16">
          <div className="text-center space-y-4 sm:space-y-8">

            {/* Караоке-шарик */}
            <motion.div
              className="flex justify-center"
              animate={{
                x: currentWord * 40 - (line.words.length * 40) / 2 + 20,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Строка субтитров с адаптивной высотой */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLine}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
                className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl flex flex-wrap justify-center gap-2 sm:gap-3"
                style={{
                  minHeight: subtitleHeight.base,
                  // Tailwind responsive inline styles
                  // для реальных проектов лучше использовать классы sm:min-h-[...], но для наглядности здесь
                }}
              >
                {line.words.map((word, index) => (
                  <motion.span
                    key={`${currentLine}-${index}`}
                    className={`inline-block ${
                      index < currentWord
                        ? 'text-yellow-400 font-semibold'
                        : index === currentWord
                        ? 'text-yellow-400 font-semibold'
                        : 'text-gray-600'
                    }`}
                    animate={
                      index === currentWord
                        ? {
                            scale: [1, 1.1, 1],
                            textShadow: [
                              '0 0 0px rgba(250, 204, 21, 0)',
                              '0 0 20px rgba(250, 204, 21, 0.8)',
                              '0 0 0px rgba(250, 204, 21, 0)',
                            ],
                          }
                        : {}
                    }
                    style={{ display: 'inline-block', transformOrigin: 'bottom center' }}
                    transition={{ duration: 0.5 }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Индикатор прогресса по строкам */}
            <div className="flex justify-center gap-1.5 sm:gap-2 pt-2 sm:pt-4">
              {lyrics.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all ${
                    index === currentLine
                      ? 'w-6 sm:w-8 bg-yellow-400'
                      : index < currentLine
                      ? 'w-3 sm:w-4 bg-yellow-400/50'
                      : 'w-3 sm:w-4 bg-gray-700'
                  }`}
                />
              ))}
            </div>

          </div>
        </div>

        {/* Нижняя визуализация с адаптивной высотой */}
        <div
          className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-800/50 flex justify-center gap-0.5 sm:gap-1"
          style={{ height: visualHeight.base }} // можно менять через tailwind классы
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-0.5 sm:w-1 bg-yellow-400/30 rounded-full origin-bottom"
              style={{ height: '100%' }}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.02, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}