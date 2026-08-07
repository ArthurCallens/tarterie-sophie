import { motion } from "framer-motion";
import { useReducedMotion } from "../../lib/use-reduced-motion";

const SPRINKLE_COLORS = ["#c2453b", "#f3d9a0", "#dd9aa0", "#fbf3e6", "#a3814f"];

type Sprinkle = {
  left: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotate: number;
  drift: number;
};

function makeSprinkles(count: number): Sprinkle[] {
  const sprinkles: Sprinkle[] = [];
  for (let i = 0; i < count; i++) {
    sprinkles.push({
      left: `${(i * 97) % 100}%`,
      size: 6 + ((i * 13) % 10),
      color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length],
      duration: 9 + ((i * 7) % 8),
      delay: (i * 1.3) % 6,
      rotate: (i * 41) % 360,
      drift: ((i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 8)),
    });
  }
  return sprinkles;
}

const sprinkles = makeSprinkles(18);

export function SprinkleField() {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {sprinkles.map((s, i) => (
        <motion.span
          key={i}
          className="absolute top-full rounded-full"
          style={{
            left: s.left,
            width: s.size,
            height: s.size * 0.4,
            backgroundColor: s.color,
            rotate: s.rotate,
          }}
          animate={{
            y: [0, -700],
            x: [0, s.drift],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
