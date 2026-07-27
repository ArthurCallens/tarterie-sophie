import { motion } from "framer-motion";
import { useReducedMotion } from "../../lib/use-reduced-motion";

const COLORS = ["#c2453b", "#f3d9a0", "#dd9aa0", "#a3814f", "#9c332b"];

type Particle = {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
};

function makeParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i + (i % 2 === 0 ? 6 : -6);
    particles.push({
      angle,
      distance: 70 + ((i * 17) % 40),
      size: 5 + ((i * 3) % 6),
      color: COLORS[i % COLORS.length],
      delay: (i % 5) * 0.02,
      rotate: (i * 53) % 360,
    });
  }
  return particles;
}

const particles = makeParticles(16);

export function SuccessBurst() {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" aria-hidden="true">
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: p.size, height: p.size * 0.45, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
            animate={{ x, y, opacity: [0, 1, 1, 0], rotate: p.rotate, scale: 1 }}
            transition={{ duration: 0.9, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}
