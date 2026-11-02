import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { universalEngine } from './services/universalEngine'
import { mobileStorage } from './services/mobileStorage'

if (typeof window !== 'undefined') {
  (window as any).universalEngine = universalEngine;
  (window as any).mobileStorage = mobileStorage;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
