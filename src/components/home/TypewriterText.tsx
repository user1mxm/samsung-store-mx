import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function TypewriterText({ texts, speed = 80, delay = 2000 }: { texts: string[]; speed?: number; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  const [index, setIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    const currentText = texts[textIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (isDeleting) {
      if (displayText === '') {
        setIsDeleting(false)
        setTextIndex((prev) => (prev + 1) % texts.length)
        timeout = setTimeout(() => {}, 300)
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentText.substring(0, index - 1))
          setIndex((prev) => prev - 1)
        }, speed / 2)
      }
    } else {
      if (index === currentText.length) {
        timeout = setTimeout(() => setIsDeleting(true), delay)
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentText.substring(0, index + 1))
          setIndex((prev) => prev + 1)
        }, speed)
      }
    }

    return () => clearTimeout(timeout)
  }, [index, isDeleting, textIndex, texts, speed, delay, displayText])

  return (
    <span className="inline-block">
      <span className="text-shimmer">{displayText}</span>
      <motion.span
        className="inline-block w-[3px] rounded-full bg-gradient-to-b from-[#1428A0] to-[#00BFFF] ml-1 align-middle"
        style={{ height: '0.85em' }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      />
    </span>
  )
}
