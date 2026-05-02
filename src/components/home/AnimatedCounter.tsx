import { useState, useEffect } from 'react'
import { useSpring } from 'framer-motion'

export function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const spring = useSpring(0, { stiffness: 50, damping: 20 })
  useEffect(() => {
    spring.set(value)
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)))
    return unsub
  }, [value, spring])
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>
}
