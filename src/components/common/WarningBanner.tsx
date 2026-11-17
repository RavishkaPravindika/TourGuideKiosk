import type { ReactNode } from 'react'
import styles from './WarningBanner.module.scss'

interface WarningBannerProps {
  title: string
  children: ReactNode
}

export function WarningBanner({ title, children }: WarningBannerProps) {
  return (
    <aside className={styles.banner} role="alert">
      <h2>{title}</h2>
      <div>{children}</div>
    </aside>
  )
}
