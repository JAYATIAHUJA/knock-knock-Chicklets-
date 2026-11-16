import {useEffect,useState,type ReactNode} from 'react';
import './landing.css';
import {sounds} from './sound';

const PRELOADER_DURATION=2400;

export function Landing({children}:{children:ReactNode}){
 const [loaded,setLoaded]=useState(()=>{
  // Agar user iss session mein pehle dekh chuka hai toh direct site dikhao
  return Boolean(sessionStorage.getItem('chicklets_intro_seen'));
 });
 const [animStep,setAnimStep]=useState<'knock1'|'knock2'|'reveal'|'done'>('knock1');

 useEffect(()=>{
  if(loaded)return;

  // Sound effects & stage progression during preloader
  sounds.playKnock();
  const t1=setTimeout(()=>{
    setAnimStep('knock2');
    sounds.playKnock();
  },700);

  const t2=setTimeout(()=>{
    setAnimStep('reveal');
  },1500);

  const t3=setTimeout(()=>{
    setAnimStep('done');
    setLoaded(true);
    sessionStorage.setItem('chicklets_intro_seen','true');
  },PRELOADER_DURATION);

  return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)};
 },[loaded]);

 function replayIntro(){
  sessionStorage.removeItem('chicklets_intro_seen');
  setAnimStep('knock1');
  setLoaded(false);
 }

 return <div className="landing-root">
  {/* ══════════════════════════════════════════════
      1. INTRO / PRELOADER CURTAIN (Only during animation)
      ══════════════════════════════════════════════ */}
  {!loaded&&(
   <aside className={`intro-curtain ${animStep==='reveal'?'curtain-dissolve':''}`} aria-label="Game introduction">
    <div className="curtain-vignette"/>
    <div className="curtain-stage">
      <div className={`knock-fx ${animStep}`}>
        <span className="knock-word">ठक! ठक!</span>
        <div className="knock-wave-ring"/>
        <div className="knock-wave-ring delayed"/>
      </div>
      <div className={`intro-hand ${animStep}`}>
        <img src="/art/knocking-hand.png" alt="Knocking hand" draggable="false"/>
      </div>
      <p className="intro-tagline">“Knock knock... Kaun hai?”</p>
    </div>
    <button className="skip-intro-btn" onClick={()=>{setLoaded(true);sessionStorage.setItem('chicklets_intro_seen','true');}}>
      Skip Intro ➔
    </button>
   </aside>
  )}

  {/* ══════════════════════════════════════════════
      2. REAL WEBSITE (Pure, Clean, Authentic Mohalla UI - No Hands!)
      ══════════════════════════════════════════════ */}
  <main className="real-mohalla-site">
   {/* Header Navigation */}
   <header className="site-header">
    <div className="header-brand">
     <span className="brand-chakra">❋</span>
     <div>
      <h1 className="brand-title">CHICKLETS</h1>
      <span className="brand-sub">गली नंबर ०४ · मोहल्ला अड्डा</span>
     </div>
    </div>
    <div className="header-actions">
     <button className="badge-btn" onClick={replayIntro} title="Watch intro again">
      Replay Intro ↺
     </button>
    </div>
   </header>

   {/* Main Hero & Adda Creation Stage */}
   <div className="hero-viewport">
    {/* Left Column: Game Lore & Visual Banner */}
    <section className="hero-left">
     <div className="hero-poster">
      <div className="poster-pill">★ BACHPAN KI YAADEIN ★</div>
      <h2 className="poster-headline">Peeth Par Thak-Thak,<br/>Mohalla Mein Bhaag-Daud!</h2>
      <p className="poster-desc">
       Apna secret chuno, chor (denner) ko gumrah karo, aur jaise hi pakde jao — <strong>Relay Call</strong> karke dusre dost par shikaar daal do!
      </p>

      {/* Feature highlights */}
      <div className="feature-badges">
       <div className="f-badge">
        <span className="f-icon">👑</span>
        <div>
         <strong>Chor / Denner</strong>
         <small>Secret pehchaan ke pakdo</small>
        </div>
       </div>
       <div className="f-badge">
        <span className="f-icon">🎭</span>
        <div>
         <strong>Secret Identities</strong>
         <small>Maruti, BMW, Mango, Tiger</small>
        </div>
       </div>
       <div className="f-badge">
        <span className="f-icon">📢</span>
        <div>
         <strong>Relay Passing</strong>
         <small>Bhaagte waqt naam pukaro</small>
        </div>
       </div>
      </div>
     </div>
    </section>

    {/* Right Column: Adda Creation & Room Join */}
    <section className="hero-right">
     <div className="adda-card">
      <div className="adda-card-tag">DESI ADDA ENTRY</div>
      <h3 className="adda-heading">Khel Mein Shamil Ho</h3>
      <p className="adda-subtitle">Nickname chuno aur turant room shuru karo:</p>
      
      {/* Form children passed from App.tsx */}
      <div className="adda-form-container">
       {children}
      </div>
     </div>
    </section>
   </div>

   {/* Footer: Authentic Truck-Art Ribbon */}
   <footer className="site-footer">
    <span>★ BURI NAZAR WALE TERA MUH KAALA ★ DHEERE CHALNA SAKHT MANA HAI ★ HORN OK PLEASE ★</span>
   </footer>
  </main>
 </div>;
}
