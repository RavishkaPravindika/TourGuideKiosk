import styles from './HeritageScene.module.scss'

export function HeritageScene() {
  return (
    <svg className={styles.scene} viewBox="0 0 960 420" role="img" aria-label="Coastal hills and a stupa">
      <rect width="960" height="420" fill="#E7EFE6" />
      <circle cx="760" cy="92" r="46" fill="#C5A15D" />
      <path d="M0 250c80-70 150-70 230-20s140 20 210-30 150-40 230 10 180 20 290-20v230H0z" fill="#6F9B62" />
      <path d="M0 300c120-40 190-10 280 10s170-20 260 16 180 10 250-24 120-20 170 8v110H0z" fill="#246B4A" />
      <path d="M0 360c140 20 220-10 340 8 130 18 180-16 300 4 90 16 180 8 320-12v60H0z" fill="#174A35" />
      <path d="M430 248c18-70 18-108 0-150" fill="none" stroke="#F7F5EC" strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="430" cy="112" rx="28" ry="16" fill="#F7F5EC" />
      <rect x="418" y="248" width="24" height="18" rx="4" fill="#F7F5EC" />
      <path d="M120 286c20-54 22-78 8-108" fill="none" stroke="#174A35" strokeWidth="6" strokeLinecap="round" />
      <path d="M128 190c28 8 36 28 18 48-22-6-30-22-18-48z" fill="#174A35" />
      <path d="M820 250c16-48 18-70 6-96" fill="none" stroke="#174A35" strokeWidth="6" strokeLinecap="round" />
      <path d="M826 164c24 8 32 26 16 44-20-6-26-20-16-44z" fill="#174A35" />
    </svg>
  )
}
