import React, { Suspense } from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import './index.css'
import './i18n'; // Import i18n config

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  </StrictMode>,
)
