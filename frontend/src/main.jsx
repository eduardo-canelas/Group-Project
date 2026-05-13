import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//CSS
import './index.css'
import './routepulse-refresh.css'
//Load main app component
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
