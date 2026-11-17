import { useRef } from 'react'
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
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="currentColor" />
        <path
          d="M32 12c2 8 2 12 0 18-6 2-12 8-12 16 0 4 3 8 12 8s12-4 12-8c0-8-6-14-12-16 2-6 2-10 0-18z"
          fill="#F7F5EC"
        />
        <circle cx="32" cy="30" r="3" fill="#C5A15D" />
      </svg>
      <span>{appName}</span>
    </button>
  )
}
