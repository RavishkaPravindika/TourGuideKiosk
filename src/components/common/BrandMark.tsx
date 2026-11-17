import { useRef } from 'react'
import explorerIcon from '/Adventurous-Boy_RemoveBackground.png'
import styles from './BrandMark.module.scss'

const LONG_PRESS_MS = 700
const TAP_WINDOW_MS = 2500
const TAP_COUNT = 5

interface BrandMarkProps {
  onAdminGesture?: () => void
  appName?: string
}

export function BrandMark({ onAdminGesture, appName = 'Explore Sri Lanka' }: BrandMarkProps) {
  const timerRef = useRef<number | null>(null)
  const tapsRef = useRef<number[]>([])

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      type="button"
      className={styles.mark}
      aria-label={appName}
      onContextMenu={(event) => {
        if (onAdminGesture) event.preventDefault()
      }}
      onPointerDown={() => {
        if (!onAdminGesture) return
        clearTimer()
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null
          onAdminGesture()
        }, LONG_PRESS_MS)
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      onClick={() => {
        if (!onAdminGesture) return
        const now = Date.now()
        tapsRef.current = [...tapsRef.current.filter((stamp) => now - stamp < TAP_WINDOW_MS), now]
        if (tapsRef.current.length >= TAP_COUNT) {
          tapsRef.current = []
          onAdminGesture()
        }
      }}
    >
      <img src={explorerIcon} alt="" width="36" height="36" style={{ display: 'block' }} />
      <span>{appName}</span>
    </button>
  )
}