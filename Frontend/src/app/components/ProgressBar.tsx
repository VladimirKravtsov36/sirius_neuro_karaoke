import { motion } from 'motion/react';
import { Play, Pause } from 'lucide-react';

interface ProgressBarProps {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean; // Получаем из Song.tsx
  onSeek: (time: number) => void; // Получаем из Song.tsx
  onPlayPauseToggle: () => void; // Получаем из Song.tsx
}

export function ProgressBar({ currentTime, totalDuration, isPlaying, onSeek, onPlayPauseToggle }: ProgressBarProps) {
  // Удаляем внутренние состояния isPlaying, isDragging, localTime
  // useEffect для auto-increment больше не нужны

  // const [isPlaying, setIsPlaying] = useState(true); // УДАЛЕНО
  // const [isDragging, setIsDragging] = useState(false); // УДАЛЕНО
  // const [localTime, setLocalTime] = useState(currentTime); // УДАЛЕНО

  // useEffect(() => { ... }); // УДАЛЕНО (auto-increment)

  // useEffect(() => { ... }); // УДАЛЕНО (синхронизация с currentTime)

  const progress = (currentTime / totalDuration) * 100; // Используем currentTime напрямую

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;
    onSeek(newTime); // Вызываем функцию из родителя
  };

  return (
    <div className="relative bg-gradient-to-t from-black/80 to-transparent backdrop-blur-lg border-t border-gray-800/50">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      
      <div className="px-6 py-4 space-y-3">
        <div
          className="relative h-2 bg-gray-800 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-md transition-all"
            style={{ width: `${progress}%` }}
          ></div>

          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/50"
            style={{ width: `${progress}%` }}
            initial={false}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={onPlayPauseToggle} // Вызываем функцию из родителя
              className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              {isPlaying ? ( // Используем isPlaying из пропсов
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
            </button>

            <span className="font-mono text-gray-400 tabular-nums">
              {formatTime(currentTime)} {/* Используем currentTime из пропсов */}
            </span>
          </div>

          <span className="font-mono text-gray-500 tabular-nums">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}