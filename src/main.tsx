import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";

const videos = [
  { id: 1, title: "Gaming Zone", category: "Gaming", views: "12K views", time: "5:20", color: "linear-gradient(135deg,#6424ff,#17102f)" },
  { id: 2, title: "Music World", category: "Music", views: "8.5K views", time: "3:45", color: "linear-gradient(135deg,#ed315d,#40152d)" },
  { id: 3, title: "Sports Highlights", category: "Sports", views: "25K views", time: "8:12", color: "linear-gradient(135deg,#078b72,#102c27)" },
  { id: 4, title: "Kids Cartoon", category: "Kids", views: "18K views", time: "6:30", color: "linear-gradient(135deg,#e89b20,#51300b)" },
  { id: 5, title: "Learn Something New", category: "Education", views: "6K views", time: "10:15", color: "linear-gradient(135deg,#237bd8,#142c52)" },
  { id: 6, title: "Entertainment Show", category: "Entertainment", views: "32K views", time: "7:05", color: "linear-gradient(135deg,#b02bd4,#381442)" },
];

const categories = ["All", "Gaming", "Music", "Sports", "Kids", "Education", "Entertainment"];

function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [message, setMessage] = useState("");

  const filteredVideos = useMemo(() => videos.filter((video) => {
    const matchesCategory = category === "All" || video.category === category;
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) ||
      video.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [search, category]);

  function playVideo() {
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) {
      setVideoId(match[1]);
      setMessage("");
    } else {
      setMessage("درست YouTube لنک درج کریں۔");
      setVideoId("");
    }
  }

  return (
    <div className="app">
      <style>{`
        *{box-sizing:border-box}
        body{margin:0;background:#090a0e;color:#fff;font-family:Arial,sans-serif}
        button,input{font:inherit}
        .app{min-height:100vh;background:radial-gradient(ellipse at top,#21101b 0%,#090a0e 48%)}
        .topbar{height:76px;padding:0 5%;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #29252b;background:#0b0b0ddd;position:sticky;top:0;z-index:5;gap:16px}
        .logo{font-size:27px;font-weight:900;letter-spacing:2px;color:#fff}
        .logo span{color:#ff3155}
        .search{width:min(390px,45vw);background:#17171d;border:1px solid #35323a;border-radius:30px;padding:13px 18px;color:white;outline:none}
        .search:focus{border-color:#ff3155}
        .hero{padding:65px 6% 48px;max-width:1300px;margin:auto}
        .tag{color:#ff5874;font-weight:bold;letter-spacing:3px;font-size:12px}
        h1{font-size:clamp(38px,7vw,70px);line-height:1.05;margin:17px 0}
        h1 span{color:#ff3155}
        .sub{color:#aaa;line-height:1.7;max-width:580px;font-size:16px}
        .section{max-width:1300px;margin:auto;padding:10px 6% 45px}
        .section-title{font-size:23px;margin:10px 0 20px}
        .categories{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:25px}
        .chip{border:1px solid #39343d;background:#17151b;color:#ddd;padding:10px 17px;border-radius:25px;cursor:pointer}
        .chip.active,.chip:hover{background:#ff3155;border-color:#ff3155;color:white}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
        .card{background:#15151b;border:1px solid #292832;border-radius:15px;overflow:hidden;cursor:pointer;transition:.2s}
        .card:hover{transform:translateY(-5px);border-color:#ff3155}
        .thumb{height:145px;display:flex;align-items:center;justify-content:center;font-size:45px;position:relative}
        .duration{position:absolute;bottom:10px;right:10px;background:#080808dd;padding:5px 8px;border-radius:5px;font-size:12px}
        .card-info{padding:15px}
        .card-info h3{margin:0 0 9px;font-size:17px}
        .muted{color:#999;font-size:13px}
        .player-box{background:#15151b;border:1px solid #302b34;border-radius:15px;padding:18px}
        .player{width:100%;aspect-ratio:16/9;background:#050505;border-radius:10px;overflow:hidden}
        .player iframe{width:100%;height:100%;border:0}
        .urlrow{display:flex;gap:10px;margin-top:15px}
        .urlrow input{flex:1;min-width:0;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:13px}
        .play{background:#ff3155;color:white;border:0;border-radius:9px;padding:13px 20px;font-weight:bold;cursor:pointer}
        .message{color:#ff8296;margin-top:10px}
        footer{text-align:center;padding:30px;color:#777;border-top:1px solid #29252b}
        @media(max-width:600px){.topbar{padding:0 4%;height:66px}.logo{font-size:22px}.hero{padding-top:45px}.urlrow{flex-direction:column}.play{width:100%}}
      `}</style>

      <header className="topbar">
        <div className="logo">TUBE<span>XA</span></div>
        <input className="search" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
      </header>

      <main>
        <section className="hero">
          <div className="tag">YOUR VIDEO WORLD</div>
          <h1>Discover. Watch.<br /><span>Experience.</span></h1>
          <p className="sub">Welcome to TUBEXA — explore videos, discover new categories and enjoy your video experience in one place.</p>
        </section>

        <section className="section">
          <h2 className="section-title">Explore Categories</h2>
          <div className="categories">
            {categories.map(item => (
              <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>

          <h2 className="section-title">Discover Videos</h2>
          <div className="grid">
            {filteredVideos.map(video => (
              <article className="card" key={video.id} onClick={() => {
                setYoutubeUrl("");
                setVideoId("");
                setMessage("یہ ڈیمو کارڈ ہے۔ ویڈیو چلانے کے لیے نیچے YouTube لنک درج کریں۔");
              }}>
                <div className="thumb" style={{background:video.color}}>
                  ▶
                  <span className="duration">{video.time}</span>
                </div>
                <div className="card-info">
                  <h3>{video.title}</h3>
                  <div className="muted">{video.category} · {video.views}</div>
                </div>
              </article>
            ))}
          </div>
          {filteredVideos.length === 0 && <p className="muted">کوئی ویڈیو نہیں ملی۔ دوسری سرچ کریں۔</p>}
        </section>

        <section className="section">
          <h2 className="section-title">Watch a YouTube Video</h2>
          <div className="player-box">
            <div className="player">
              {videoId ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="TUBEXA video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              ) : (
                <div style={{height:"100%",display:"grid",placeItems:"center",color:"#999",textAlign:"center",padding:20}}>
                  <div><div style={{fontSize:48,color:"#ff3155"}}>▶</div>اپنا YouTube لنک نیچے درج کریں</div>
                </div>
              )}
            </div>
            <div className="urlrow">
              <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube video link here..." />
              <button className="play" onClick={playVideo}>Play Video</button>
            </div>
            {message && <div className="message">{message}</div>}
          </div>
        </section>
      </main>

      <footer>© 2026 TUBEXA · Your Video World</footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
