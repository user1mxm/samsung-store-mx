import { useState, useCallback, useRef } from 'react'
import { Mic } from 'lucide-react'
import { toast } from 'sonner'

export function VoiceSearch({ onResult, className }: { onResult: (text: string) => void; className?: string }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Tu navegador no soporta busqueda por voz')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-MX'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e: any) => { onResult(e.results[0][0].transcript) }
    recognition.onerror = () => { setListening(false); toast.error('Error en reconocimiento de voz') }
    recognition.start()
    recognitionRef.current = recognition
  }, [onResult])

  return (
    <button onClick={startListening} className={`relative ${className}`}>
      <Mic className={`w-4 h-4 ${listening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
      {listening && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
    </button>
  )
}
