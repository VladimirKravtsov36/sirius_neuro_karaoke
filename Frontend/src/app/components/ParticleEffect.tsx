import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  intensity?: number;
  count?: number;
  duration?: number;
}

export function ParticleEffect({ x, y, intensity = 1.0, count = 15, duration = 1.5 }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = Math.round(count * intensity);
    
    // Color palette for particles
    const colors = [
      'from-yellow-300 to-yellow-500',
      'from-yellow-400 to-orange-500',
      'from-pink-300 to-pink-500',
      'from-purple-300 to-purple-500',
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = (2 + Math.random() * 3) * intensity;
      
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3 * intensity, // More upward bias
        size: (3 + Math.random() * 5) * intensity,
        opacity: (0.6 + Math.random() * 0.4) * intensity,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(newParticles);
  }, [intensity, count]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x,
        top: y,
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full bg-gradient-to-br ${particle.color}`}
          style={{
            width: particle.size,
            height: particle.size,
            boxShadow: '0 0 8px rgba(251, 191, 36, 0.3)',
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: particle.opacity,
            scale: 1,
          }}
          animate={{
            x: particle.vx * 50,
            y: particle.vy * 50,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: duration,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}