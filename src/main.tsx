import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/retro.css'
import App from './App-ai-fixed.tsx'

console.log('🚀 main.tsx is loading...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
