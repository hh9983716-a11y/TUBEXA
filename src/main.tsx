import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Agar aapke paas App.tsx hai, ya phir apna main component yahan import karein

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
