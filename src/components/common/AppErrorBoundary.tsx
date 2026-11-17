import { Component, type ErrorInfo, type ReactNode } from 'react'
import styles from './AppErrorBoundary.module.scss'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error.message, info.componentStack)
  }

  render() {
    if (!this.state.failed) {
      return this.props.children
    }

    return (
      <main className={styles.fallback}>
        <p className={styles.eyebrow}>Explore Sri Lanka</p>
        <h1>This screen could not be opened.</h1>
        <p>Close the app and open it again. If it keeps happening, tell your guide.</p>
      </main>
    )
  }
}
