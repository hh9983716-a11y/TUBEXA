
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function App() {
  const [url, setUrl] = useState('');
  const [search, setSearch] = useState('');
  const [video, setVideo] = useState('');

  function playVideo() {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) {
      setVideo(match[1]);
    } else {
      alert('براہ کرم درست YouTube ویڈیو لنک درج کریں۔');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#101010',
      color: 'white',
      fontFamily: 'Arial',
      padding: '20px'
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h1 style={{color: '#ff3030'}}>TUBEXA</h1>
        <input
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{padding: '12px', borderRadius: '20px'}}
        />
      </header>

      <h2>Welcome to TUBEXA</h2>
      <p>Discover and watch videos in one place.</p>

      <div style={{marginTop: '25px'}}>
        <h3>Play a YouTube Video</h3>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste YouTube video link"
          style={{padding: '12px', width: '70%', maxWidth: '450px'}}
        />
        <button onClick={playVideo}
          style={{
            padding: '12px 20px',
            background: '#ff3030',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}>
          Play Video
        </button>
      </div>

      {video && (
        <div style={{marginTop: '25px', maxWidth: '850px'}}>
          <iframe
            width="100%"
            height="450"
            src={`https://www.youtube-nocookie.com/embed/${video}`}
            title="TUBEXA Video Player"
            allowFullScreen
            style={{border: 'none', borderRadius: '12px'}}
          />
        </div>
      )}

      <footer style={{marginTop: '60px', color: '#999'}}>
        © 2026 TUBEXA. All rights reserved.
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
