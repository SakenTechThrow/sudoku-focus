import { useMemo, type CSSProperties } from 'react'

const CONFETTI_COLORS = [
  '#22c55e',
  '#14b8a6',
  '#38bdf8',
  '#f59e0b',
  '#f97316',
  '#e879f9',
]

export function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 18
        const distance = 88 + (index % 4) * 16
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance - 16

        return {
          id: index,
          color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          x,
          y,
          rotate: `${180 + index * 18}deg`,
          duration: `${2200 + (index % 5) * 180}ms`,
          delay: `${(index % 6) * 40}ms`,
          size: `${10 + (index % 3) * 2}px`,
        }
      }),
    [],
  )

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="confetti-particle absolute left-1/2 top-[42%] rounded-full opacity-0"
          style={{
            width: particle.size,
            height: `calc(${particle.size} * 1.8)`,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            ['--confetti-duration' as string]: particle.duration,
            ['--confetti-x' as string]: `${particle.x}px`,
            ['--confetti-y' as string]: `${particle.y}px`,
            ['--confetti-rotate' as string]: particle.rotate,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
