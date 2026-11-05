import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      textAlign: 'center', 
      padding: '50px',
      backgroundColor: '#f4f4f9',
      color: '#333',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#0070f3', marginBottom: '20px' }}>
        Welcome to TUBEXA
      </h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6' }}>
        آپ کی ویب سائٹ کامیابی کے ساتھ Vercel پر لائیو ہو چکی ہے! یہ آپ کا اصل ہوم پیج ہے۔ اب آپ یہاں اپنی مرضی کا ڈیزائن اور مواد شامل کر سکتے ہیں۔
      </p>
      <div style={{ marginTop: '30px' }}>
        <a 
          href="https://tubexa-119x.vercel.app" 
          style={{ 
            backgroundColor: '#0070f3', 
            color: 'white', 
            padding: '12px 25px', 
            textDecoration: 'none', 
            borderRadius: '5px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Live Website
        </a>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
