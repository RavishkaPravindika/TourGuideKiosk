import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useLanguage } from '@/hooks/useLanguage'
import { formatBytes, formatWhen } from '@/utils/runtime'
import styles from '@/styles/application.module.scss'

export function DiagnosticsPage() {
  const { report, running, runError, rerun } = useDiagnostics()
  const { t } = useLanguage()

  return (
    <main className={styles.content}>
      <section className={styles.sectionHeading}>
        <h1 className={styles.pageTitle}>{t('diagnostics')}</h1>
        <button className={`${styles.button} ${styles.buttonPrimary}`} disabled={running} type="button" onClick={rerun}>{running ? '…' : t('diagnostics')}</button>
      </section>
      {runError ? <p className={styles.error} role="alert">{runError}</p> : null}
      {!report ? <p className={styles.notice}>Diagnostics have not completed.</p> : (
        <>
          <section className={`${styles.section} ${styles.panel} ${styles.stack}`}>
            <h2>Environment</h2>
            <p><strong>URL:</strong> {report.environment.url}</p>
            <p><strong>Protocol:</strong> {report.environment.protocol}</p>
            <p><strong>Browser:</strong> {report.environment.userAgent}</p>
            <p><strong>Platform:</strong> {report.environment.platform}</p>
            <p><strong>Android:</strong> {report.environment.androidVersion ?? 'Unavailable'}</p>
            <p><strong>WebView:</strong> {report.environment.webViewSummary}</p>
            <p><strong>Viewport:</strong> {report.environment.viewport}</p>
            <p><strong>Build:</strong> {report.environment.buildVersion} · {formatWhen(report.environment.buildTime)}</p>
            <p><strong>Database:</strong> {report.environment.databaseName} v{report.environment.databaseVersion ?? 'unknown'} · {report.environment.databaseOpen ? 'open' : 'closed'}</p>
            <p><strong>Storage:</strong> {formatBytes(report.environment.storage.usage)} / {formatBytes(report.environment.storage.quota)}</p>
          </section>
          <section className={`${styles.section} ${styles.grid}`}>
            {report.checks.map((check) => (
              <article className={styles.panel} key={check.id}>
                <p className={styles.eyebrow}>{check.status}</p>
                <h2>{check.title}</h2>
                <p>{check.summary}</p>
                {check.detail ? <p className={styles.muted}>{check.detail}</p> : null}
              </article>
            ))}
          </section>
          <p className={styles.muted}>Latest run: {formatWhen(report.finishedAt)}</p>
          {report.criticalFailure ? <p className={styles.error}>{report.criticalFailure}</p> : null}
          <p className={styles.notice}>A browser check cannot confirm IndexedDB or media behavior after a full tablet restart. Complete the physical device checklist before relying on persistence.</p>
        </>
      )}
    </main>
  )
}
