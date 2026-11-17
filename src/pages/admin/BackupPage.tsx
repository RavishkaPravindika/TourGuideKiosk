import { useState, type ChangeEvent } from 'react'
import { createBackupBlob, restoreBackup } from '@/services/backup/backup'
import { useLanguage } from '@/hooks/useLanguage'
import { errorText } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

function requestDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function BackupPage() {
  const { t } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const exportBackup = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const blob = await createBackupBlob()
      requestDownload(blob, `explore-sri-lanka-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`)
      setNotice(t('backupDone'))
    } catch (cause) {
      setError(`${t('backupFailed')} ${errorText(cause)}`)
    } finally {
      setBusy(false)
    }
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setError(null)
    setNotice(null)
    if (!file) return
    if (!window.confirm(t('restoreWarning'))) return
    setBusy(true)
    try {
      const recovery = await createBackupBlob()
      requestDownload(recovery, `explore-sri-lanka-recovery-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`)
      if (!window.confirm(t('recoveryPrompt'))) return
      await restoreBackup(file)
      setNotice(t('restoreComplete'))
    } catch (cause) {
      setError(errorText(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.content}>
      <section className={styles.section}>
        <h1 className={styles.pageTitle}>{t('backup')}</h1>
        <p className={styles.notice}>{t('restoreWarning')}</p>
        <p className={styles.muted}>Backups contain guest contact details. Store them securely. The browser may ask where to save the ZIP.</p>
      </section>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <section className={`${styles.panel} ${styles.form}`}>
        <button className={`${styles.button} ${styles.buttonPrimary}`} disabled={busy} type="button" onClick={() => void exportBackup()}>
          {busy ? '…' : t('exportBackup')}
        </button>
        <label className={styles.field}>{t('restoreBackup')}
          <input className={styles.input} disabled={busy} type="file" accept=".zip,application/zip" onChange={(event) => void importBackup(event)} />
        </label>
      </section>
    </main>
  )
}
