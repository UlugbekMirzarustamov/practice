import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/auth'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Only report from production builds — local dev errors would otherwise flood the project.
    enabled: import.meta.env.PROD,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of transactions
    // Control which outgoing request URLs get distributed-tracing headers attached
    tracePropagationTargets: ['localhost', /^https:\/\/writeonbema\.com/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions that hit an error
    // Enable logs to be sent to Sentry
    enableLogs: true,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
