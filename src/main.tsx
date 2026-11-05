import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>TUBEXA is Live!</h1>
      <p>Aapka project kamyabi ke sath deploy ho gaya hai.</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
