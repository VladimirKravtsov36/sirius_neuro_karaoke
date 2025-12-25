import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: number;
  lane: number;
  position: number; // 0 to 100 (percentage from left)
  speed: number;
  color: string;
}

interface HitEffect {
  id: number;
  lane: number;
  type: 'hit' | 'miss';
}

const LANE_COUNT = 4;
const NOTE_COLORS = ['#A855F7', '#EC4899', '#3B82F6', '#10B981'];
const TARGET_ZONE = 85; // percentage from left
const HIT_THRESHOLD = 8; // how close to target zone to count as hit

const loadingMessages = [
  "Генерируем изображения...",
  "Достаём текст...",
  "Почти готово...",
];

export function LoadingPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [nextNoteId, setNextNoteId] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Refs for consistent state in callbacks
  const notesRef = useRef(notes);
  const comboRef = useRef(combo);
  
  // Update refs when state changes
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  // Change loading message
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate new notes
  useEffect(() => {
    const interval = setInterval(() => {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const newNote: Note = {
        id: nextNoteId,
        lane,
        position: 0,
        speed: 0.8 + Math.random() * 0.4,
        color: NOTE_COLORS[lane],
      };
      setNotes(prev => [...prev, newNote]);
      setNextNoteId(prev => prev + 1);
    }, 1200);

    return () => clearInterval(interval);
  }, [nextNoteId]);

  // Move notes
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setNotes(prev => {
        const updated = prev.map(note => ({
          ...note,
          position: note.position + note.speed,
        }));

        // Remove notes that went past the screen and missed
        return updated.filter(note => {
          if (note.position > 100) {
            // Note was missed
            setCombo(0);
            return false;
          }
          return true;
        });
      });
    }, 16); // ~60fps

    return () => clearInterval(moveInterval);
  }, []);

  // Simulate loading progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 0.5;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  // Handle note hit
  const handleHit = useCallback((lane: number) => {
    setNotes(prev => {
      const notesInLane = prev.filter(n => n.lane === lane);
      const closestNote = notesInLane.reduce((closest, note) => {
        const closestDist = Math.abs(closest.position - TARGET_ZONE);
        const currentDist = Math.abs(note.position - TARGET_ZONE);
        return currentDist < closestDist ? note : closest;
      }, { position: Infinity } as Note);

      const isHit = closestNote && 
        Math.abs(closestNote.position - TARGET_ZONE) < HIT_THRESHOLD;

      if (isHit) {
        // Hit!
        setScore(s => s + 100 + comboRef.current * 10);
        setCombo(c => c + 1);
        
        // Add hit effect
        const effectId = Date.now();
        setHitEffects(effects => [...effects, { id: effectId, lane, type: 'hit' }]);
        setTimeout(() => {
          setHitEffects(effects => effects.filter(ef => ef.id !== effectId));
        }, 500);

        // Remove the hit note
        return prev.filter(n => n.id !== closestNote.id);
      } else {
        // Miss - check if there's a note that was close
        const nearNote = notesInLane.find(
          n => Math.abs(n.position - TARGET_ZONE) < HIT_THRESHOLD * 2
        );
        
        if (nearNote) {
          setCombo(0);
          const effectId = Date.now();
          setHitEffects(effects => [...effects, { id: effectId, lane, type: 'miss' }]);
          setTimeout(() => {
            setHitEffects(effects => effects.filter(ef => ef.id !== effectId));
          }, 500);
        }
      }

      return prev;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space bar - hit random lane or the one with closest note
      if (e.code === 'Space') {
        e.preventDefault();
        
        // Find the lane with the note closest to target zone
        let closestLane = 0;
        let closestDistance = Infinity;
        
        notesRef.current.forEach(note => {
          const distance = Math.abs(note.position - TARGET_ZONE);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestLane = note.lane;
          }
        });
        
        handleHit(closestLane);
      }
      
      // Number keys 1-4 for specific lanes
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const lane = parseInt(e.code.replace('Digit', '')) - 1;
        if (lane >= 0 && lane < LANE_COUNT) {
          handleHit(lane);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleHit]);

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0B0B0F] via-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center"
    >
      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Score and Combo Display */}
      <div className="absolute top-8 left-8 z-20">
        <motion.div
          className="text-2xl font-bold text-white mb-2"
          animate={{ scale: combo > 0 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          Score: {score}
        </motion.div>
        {combo > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
          >
            Combo: {combo}x
          </motion.div>
        )}
      </div>

      {/* Game Area - Centered and Smaller - Moved up */}
      <div 
        className="relative w-full max-w-3xl h-96 md:h-[28rem] bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden mb-32"
        onClick={(e) => {
          // Touch/click handling - find which lane was clicked
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const laneHeight = rect.height / LANE_COUNT;
          const lane = Math.floor(y / laneHeight);
          if (lane >= 0 && lane < LANE_COUNT) {
            handleHit(lane);
          }
        }}
      >
        {/* Lanes */}
        {Array.from({ length: LANE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full border-b border-white/10"
            style={{
              top: `${(i / LANE_COUNT) * 100}%`,
              height: `${100 / LANE_COUNT}%`,
            }}
          >
            {/* Lane line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            
            {/* Lane number indicator (for desktop) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono hidden md:block">
              {i + 1}
            </div>
          </div>
        ))}

        {/* Target Zone */}
        <div
          className="absolute top-0 bottom-0 w-24 pointer-events-none z-10"
          style={{ left: `${TARGET_ZONE}%` }}
        >
          <div className="h-full relative">
            {/* Vertical line */}
            <div className="absolute inset-y-0 left-1/2 w-1 bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-pulse"></div>
            
            {/* Target indicators for each lane */}
            {Array.from({ length: LANE_COUNT }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-purple-500/50 rounded-full"
                style={{
                  top: `${(i / LANE_COUNT) * 100 + (50 / LANE_COUNT)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <AnimatePresence>
          {notes.map(note => (
            <motion.div
              key={note.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute w-12 h-12 flex items-center justify-center text-2xl z-10"
              style={{
                left: `${note.position}%`,
                top: `${(note.lane / LANE_COUNT) * 100 + (50 / LANE_COUNT)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50"
                style={{
                  backgroundColor: note.color,
                  boxShadow: `0 0 20px ${note.color}`,
                }}
              >
                <span className="text-white text-xl">♪</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Hit Effects */}
        <AnimatePresence>
          {hitEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute z-20 text-4xl font-bold"
              style={{
                left: `${TARGET_ZONE}%`,
                top: `${(effect.lane / LANE_COUNT) * 100 + (50 / LANE_COUNT)}%`,
                transform: 'translate(-50%, -50%)',
                color: effect.type === 'hit' ? '#10B981' : '#EF4444',
              }}
            >
              {effect.type === 'hit' ? '✓' : '✗'}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Animation - Spinning Circle */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-3">
          {/* Spinning loader */}
          <div className="relative w-16 h-16">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Inner spinning ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-500 border-l-cyan-500"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Center pulse dot */}
            <motion.div
              className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          {/* Loading text */}
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="text-white/70 text-sm"
          >
            {loadingMessages[messageIndex]}
          </motion.div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-8 right-8 text-white/50 text-sm text-right hidden md:block">
        <div>Press 1-4 for lanes</div>
        <div>or Space for auto-hit</div>
      </div>
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/50 text-sm md:hidden">
        Tap lanes to hit notes!
      </div>
    </div>
  );
}