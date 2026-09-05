import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LessonFlow } from './components/LessonFlow'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LessonFlow />
  </StrictMode>,
)
