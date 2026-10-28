import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import './MotionToggle.css'

const preferenceKey = 'norvia-motion-paused'
const savedPause = () => {
  try { return localStorage.getItem(preferenceKey) === '1' } catch { return false }
}

export default function MotionToggle() {
  const [paused, setPaused] = useState(savedPause)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => setReduced(media.matches)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])
  const label = reduced ? 'Animações reduzidas pelo dispositivo' : paused ? 'Ativar animações' : 'Pausar animações'
  function toggle() {
    const next = !paused
    setPaused(next)
    try { localStorage.setItem(preferenceKey, next ? '1' : '0') } catch { /* Preference still works in this page. */ }
    window.dispatchEvent(new CustomEvent('norvia:motion-change', { detail: { paused: next } }))
  }
  return <button className="motion-toggle" type="button" onClick={toggle} disabled={reduced} aria-label={label} title={label}>
    {paused || reduced ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
    <span>{reduced ? 'Movimento reduzido' : paused ? 'Ativar animações' : 'Pausar animações'}</span>
  </button>
}
