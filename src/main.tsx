
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./lib/supabase";

const videos = [
  { title: "Gaming Zone", category: "Gaming", views: "12K views", color: "#5125a8", icon: "🎮" },
  { title: "Music World", category: "Music", views: "8.5K views", color: "#a5224e", icon: "🎵" },
  { title: "Sports Highlights", category: "Sports", views: "25K views", color: "#087d67", icon: "⚽" },
  { title: "Kids Cartoon", category: "Kids", views: "18K views", color: "#b87916", icon: "🧸" },
  { title: "Learn Something New", category: "Education", views: "6K views", color: "#2369a8", icon: "📚" },
  { title: "Entertainment Show", category: "Entertainment", views: "32K views", color: "#812c9c", icon: "🎬" },
];

const languages = [
  "Urdu", "Hindi", "English", "Arabic", "Spanish", "French",
  "German", "Turkish", "Chinese", "Japanese", "Portuguese",
  "Russian", "Bengali", "Punjabi"
];

function App() {
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("Auto Detect");
  const [targetLanguage, setTargetLanguage] = useState("Urdu");
  const [quality, setQuality] = useState("720p");
  const [status, setStatus] = useState("");
  const [databaseStatus, setDatabaseStatus] = useState("Checking database connection...");

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error.message);
        return;
      }

      setUser(data.session?.user ?? null);
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function checkDatabase() {
      try {
        const { error } = await supabase
          .from("videos")
          .select("id", { count: "exact", head: true });

        if (error) {
          console.error("Database error:", error.message);
          setDatabaseStatus("Database connection needs attention.");
        } else {
          setDatabaseStatus("Database connected successfully.");
        }
      } catch (error) {
        console.error("Database check failed:", error);
        setDatabaseStatus("Database connection needs attention.");
      }
    }

    checkDatabase();
  }, []);

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setUser(data.session.user);
          setAuthMessage("Account created successfully!");
          setPage("home");
        } else {
          setAuthMessage("Account created! Please check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setUser(data.user);
        setAuthMessage("Login successful!");
        setPage("home");
      }
    } catch (error: any) {
      setAuthMessage(error.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setUser(null);
    setPage("home");
    setAuthMessage("You have logged out successfully.");
  }

  const filteredVideos = useMemo(() => videos.filter(v =>
    (category === "All" || v.category === category) &&
    (v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()))
  ), [search, category]);

  function playVideo() {
    const match = youtubeUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
    );

    if (match) {
      setVideoId(match[1]);
      setStatus("");
    } else {
      setVideoId("");
      setStatus("Please enter a valid YouTube video URL.");
    }
  }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.startsWith("video/")) {
        setStatus("Please select a valid video file.");
        return;
      }

      setVideoFile(file);
      setStatus("Video selected successfully.");
    }
  }

  const styles = `
    *{box-sizing:border-box}
    body{margin:0;background:#090a0e;color:#fff;font-family:Arial,sans-serif}
    button,input,select{font:inherit}
    button{cursor:pointer}
    .app{min-height:100vh;background:radial-gradient(ellipse at top,#24101b,#090a0e 48%)}
    .topbar{min-height:72px;padding:12px 5%;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid #29252b;background:#0b0b0dee;position:sticky;top:0;z-index:5}
    .logo{font-size:27px;font-weight:900;letter-spacing:2px;white-space:nowrap}
    .logo span{color:#ff3155}
    .search{width:min(350px,45vw);background:#17171d;border:1px solid #35323a;border-radius:30px;padding:12px 17px;color:white;outline:none}
    .nav{display:flex;gap:8px;flex-wrap:wrap}
    .nav button,.chip{border:1px solid #39343d;background:#17151b;color:#ddd;padding:10px 14px;border-radius:24px}
    .nav button.active,.chip.active,.primary{background:#ff3155;border-color:#ff3155;color:white}
    .hero{padding:60px 6% 40px;max-width:1300px;margin:auto}
    .tag{color:#ff5874;font-weight:bold;letter-spacing:3px;font-size:12px}
    h1{font-size:clamp(38px,7vw,68px);line-height:1.05;margin:17px 0}
    h1 span{color:#ff3155}
    .sub{color:#aaa;line-height:1.7;max-width:650px}
    .section{max-width:1300px;margin:auto;padding:12px 6% 42px}
    .section-title{font-size:23px;margin:12px 0 20px}
    .categories{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:25px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:17px}
    .card{background:#15151b;border:1px solid #292832;border-radius:15px;overflow:hidden}
    .thumb{height:140px;display:grid;place-items:center;font-size:45px}
    .card-info{padding:14px}
    .card-info h3{margin:0 0 8px;font-size:17px}
    .muted{color:#999;font-size:13px}
    .panel{background:#15151b;border:1px solid #302b34;border-radius:16px;padding:22px}
    .field{display:flex;flex-direction:column;gap:9px;margin:17px 0}
    .field label{color:#ddd;font-size:14px;font-weight:bold}
    .field input,.field select{width:100%;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:13px}
    .primary{border:0;border-radius:9px;padding:13px 20px;font-weight:bold}
    .upload{border:2px dashed #51404b;border-radius:13px;padding:28px;text-align:center;background:#100f14}
    .upload input{margin-top:15px;max-width:100%}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .notice{padding:13px;border-radius:9px;background:#28202a;color:#ffbdca;line-height:1.6;margin-top:15px;font-size:13px}
    .player{width:100%;aspect-ratio:16/9;background:#050505;border-radius:10px;overflow:hidden;display:grid;place-items:center;color:#999;text-align:center}
    .player iframe{width:100%;height:100%;border:0}
    .urlrow{display:flex;gap:10px;margin-top:15px}
    .urlrow input{flex:1;min-width:0;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:13px}
    .message{color:#ff91a4;margin-top:12px;line-height:1.6}
    .db-status{font-size:12px;color:#aaa;margin-top:12px}
    .auth-panel{max-width:470px;margin:10px auto 50px}
    .auth-panel h2{text-align:center;margin-top:5px}
    .auth-switch{background:none;border:0;color:#ff5874;padding:10px}
    .auth-actions{display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap;margin-top:12px}
    .account-email{font-size:12px;color:#aaa;max-width:150px;overflow-wrap:anywhere}
    footer{text-align:center;padding:28px;color:#777;border-top:1px solid #29252b}
    @media(max-width:700px){.topbar{flex-wrap:wrap}.search{width:100%;order:3}.two{grid-template-columns:1fr}.urlrow{flex-direction:column}.urlrow button{width:100%}.hero{padding-top:40px}}
  `;

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="topbar">
        <div className="logo">TUBE<span>XA</span></div>

        <div className="nav">
          <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>Home</button>
          <button className={page === "dubbing" ? "active" : ""} onClick={() => setPage("dubbing")}>AI Dubbing</button>
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <button className={page === "auth" ? "active" : ""} onClick={() => { setPage("auth"); setAuthMessage(""); }}>Login / Sign Up</button>
          )}
        </div>

        {user && <div className="account-email">{user.email}</div>}

        {page === "home" && (
          <input className="search" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
        )}
      </header>

      {page === "auth" ? (
        <main>
          <section className="hero">
            <div className="tag">WELCOME TO TUBEXA</div>
            <h1>Your Account.<br /><span>Your Video World.</span></h1>
            <p className="sub">Create your account or log in to continue.</p>
          </section>

          <section className="section">
            <div className="panel auth-panel">
              <h2>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>

              <form onSubmit={handleAuth}>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  />
                </div>

                <button className="primary" type="submit" disabled={authLoading} style={{width:"100%"}}>
                  {authLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Login"}
                </button>
              </form>

              {authMessage && <div className="notice">{authMessage}</div>}

              <div className="auth-actions">
                <span className="muted">
                  {authMode === "signup" ? "Already have an account?" : "New to TUBEXA?"}
                </span>
                <button
                  className="auth-switch"
                  onClick={() => {
                    setAuthMode(authMode === "signup" ? "login" : "signup");
                    setAuthMessage("");
                  }}
                >
                  {authMode === "signup" ? "Login" : "Sign Up"}
                </button>
              </div>
            </div>
          </section>
        </main>
      ) : page === "home" ? (
        <main>
          <section className="hero">
            <div className="tag">YOUR VIDEO WORLD</div>
            <h1>Discover. Watch.<br /><span>Experience.</span></h1>
            <p className="sub">Welcome to TUBEXA — explore videos, discover new categories and enjoy your video experience in one place.</p>
            <button className="primary" onClick={() => setPage("dubbing")}>Explore AI Dubbing →</button>
            <div className="db-status">{databaseStatus}</div>
          </section>

          <section className="section">
            <h2 className="section-title">Explore Categories</h2>
            <div className="categories">
              {["All", "Gaming", "Music", "Sports", "Kids", "Education", "Entertainment"].map(item =>
                <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
              )}
            </div>

            <h2 className="section-title">Discover Videos</h2>
            <div className="grid">
              {filteredVideos.map(v => (
                <article className="card" key={v.title}>
                  <div className="thumb" style={{background:v.color}}>{v.icon}</div>
                  <div className="card-info">
                    <h3>{v.title}</h3>
                    <div className="muted">{v.category} · {v.views}</div>
                  </div>
                </article>
              ))}
            </div>
            {filteredVideos.length === 0 && <p className="muted">No videos found. Try another search.</p>}
          </section>

          <section className="section">
            <h2 className="section-title">Watch a YouTube Video</h2>
            <div className="panel">
              <div className="player">
                {videoId ? (
                  <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="TUBEXA video player" allowFullScreen />
                ) : (
                  <div><div style={{fontSize:45,color:"#ff3155"}}>▶</div>Enter a YouTube video URL</div>
                )}
              </div>
              <div className="urlrow">
                <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube video link..." />
                <button className="primary" onClick={playVideo}>Play Video</button>
              </div>
              {status && <div className="message">{status}</div>}
            </div>
          </section>
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="tag">TUBEXA AI STUDIO</div>
            <h1>AI Video<br /><span>Dubbing Studio</span></h1>
            <p className="sub">Upload your video, select source and target languages, and prepare your dubbing.</p>
          </section>

          <section className="section">
            <div className="panel">
              <h2 className="section-title">1. Upload Your Video</h2>
              <div className="upload">
                <div style={{fontSize:42}}>📁</div>
                <h3>Select Your Video</h3>
                <p className="muted">Choose an MP4, MOV, or another supported video file.</p>
                <input type="file" accept="video/*" onChange={selectFile} />
                {videoFile && <p style={{color:"#72e0ad"}}>Selected File: {videoFile.name}</p>}
              </div>

              <h2 className="section-title" style={{marginTop:30}}>2. Select Languages</h2>
              <div className="two">
                <div className="field">
                  <label>Original Video Language</label>
                  <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value)}>
                    <option>Auto Detect</option>
                    {languages.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Target Dubbing Language</label>
                  <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)}>
                    {languages.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <h2 className="section-title" style={{marginTop:25}}>3. Export Quality</h2>
              <div className="field">
                <label>Video Quality</label>
                <select value={quality} onChange={e => setQuality(e.target.value)}>
                  {["360p", "480p", "720p", "1080p", "2K", "4K"].map(q => <option key={q}>{q}</option>)}
                </select>
              </div>

              <h2 className="section-title" style={{marginTop:25}}>4. Output Options</h2>
              <div className="notice">
                Target Language: <b>{targetLanguage}</b><br />
                Export Quality: <b>{quality}</b><br />
                Output Format: <b>MP4</b>
              </div>

              <button className="primary" style={{width:"100%",marginTop:20}} onClick={() => setStatus("Your settings are saved. The AI dubbing and MP4 export service still needs to be connected.")}>
                Prepare Dubbing
              </button>

              {status && <div className="message">{status}</div>}

              <div className="notice">
                <b>Important:</b> This is the initial interface. AI voice generation, video processing, and downloads are not active yet. Only use videos you own or have permission to process.
              </div>
            </div>
          </section>
        </main>
      )}

      <footer>© 2026 TUBEXA · Your Video World</footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
    
