import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export function CountdownTimer() {
  const [time, setTime] = useState({ h: 23, m: 59, s: 45 })
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => { let { h, m, s } = prev; s--; if (s < 0) { s = 59; m-- } if (m < 0) { m = 59; h-- } if (h < 0) h = 23; return { h, m, s } })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-orange-500" />
      <span className="text-sm font-bold tabular-nums">{pad(time.h)}:{pad(time.m)}:{pad(time.s)}</span>
    </div>
  )
}
