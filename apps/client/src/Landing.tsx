import {useEffect,useRef,useState,type ReactNode} from 'react';
import './landing.css';
import {sounds} from './sound';

const PRELOADER_DURATION=3000;

export function Landing({children,onPlay}:{children:ReactNode;onPlay:()=>void}){
 const [loaded,setLoaded]=useState(()=>{
  // Agar user iss session mein pehle dekh chuka hai toh direct site dikhao
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(sessionStorage.getItem('chicklets_intro_seen')) || new URLSearchParams(location.search).has('room');
 });
 const skipButton=useRef<HTMLButtonElement>(null);
 const replayButton=useRef<HTMLButtonElement>(null);
 const [animStep,setAnimStep]=useState<'knock1'|'knock2'|'reveal'|'exit'|'done'>('knock1');

 useEffect(()=>{
  if(loaded)return;

  skipButton.current?.focus();
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')finishIntro()};
  window.addEventListener('keydown',escape);
  // Progress the introduction without delaying the form.
  sounds.playKnock();
  const t1=setTimeout(()=>{
    setAnimStep('knock2');
    sounds.playKnock();
  },620);

  const t2=setTimeout(()=>{
    setAnimStep('reveal');
  },1250);

  const t3=setTimeout(()=>setAnimStep('exit'),2450);

  const t4=setTimeout(()=>{
    finishIntro();
  },PRELOADER_DURATION);

  return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4);document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',escape)};
 },[loaded]);

 function finishIntro(){
  setLoaded(true);
  setAnimStep('done');
  try{sessionStorage.setItem('chicklets_intro_seen','true')}catch{}
  requestAnimationFrame(()=>replayButton.current?.focus());
 }
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
   <aside role="dialog" aria-modal="true" className={`intro-curtain intro-${animStep}`} aria-label="Game introduction">
    <div className="curtain-vignette"/>
    <div className="intro-door door-left"><img className="shutter-hand" alt="" src="/art/knocking-hand.png"/><span>LANE 04</span></div>
    <div className="intro-door door-right"><img className="shutter-hand" alt="" src="/art/knocking-hand.png"/><span>KNOCK HERE</span></div>
    <div className="curtain-stage">
      <div className={`knock-fx ${animStep}`}>
        <span className="knock-word"><i>Knock</i><i>Knock</i></span>
        <div className="knock-wave-ring"/>
        <div className="knock-wave-ring delayed"/>
      </div>
      <div className={`intro-hand ${animStep}`}>
        <img src="/art/knocking-hand.png" alt="Knocking hand" draggable="false"/>
      </div>
      <div className="intro-title-lockup" aria-label="Knock knock Chicklets">
       <span className="intro-overline">KNOCK · KNOCK</span>
       <strong>CHICKLETS</strong>
       <span className="intro-hindi">The neighborhood chase</span>
      </div>
      <p className="intro-tagline">Who’s there?</p>
    </div>
    <button ref={skipButton} className="skip-intro-btn" onClick={finishIntro}>
      Skip intro <span aria-hidden="true">→</span>
    </button>
   </aside>
  )}

  {/* ══════════════════════════════════════════════
      2. REAL WEBSITE (Pure, Clean, Authentic Mohalla UI - No Hands!)
      ══════════════════════════════════════════════ */}
  <main className="real-mohalla-site" inert={!loaded}>
   {/* Header Navigation */}
   <header className="site-header">
    <div className="header-brand">

     <div>
      <h1 className="brand-title">CHICKLETS</h1>
      <span className="brand-sub">Lane 04 · Multiplayer courtyard</span>
     </div>
    </div>
    <div className="header-actions">
     <button ref={replayButton} className="badge-btn" onClick={replayIntro} title="Watch intro again">
      Replay Intro ↺
     </button>
    </div>
   </header>

   {/* Main Hero & Adda Creation Stage */}
   <div className="hero-viewport">
    {/* Left Column: Game Lore & Visual Banner */}
    <section className="hero-left">
     <div className="arcade-cover">
      <h2>Knock. Guess.<br/><em>Run.</em></h2>
      <StreetDemo/>
      <details className="rulebook"><summary>How to play</summary>
       <ol><li><strong>Pick a secret.</strong> The Denner picks a category. If it’s cars, each player secretly picks a different car.</li>
       <li><strong>Call their bluff.</strong> The Denner taps someone and guesses their name. They get a comeback. A correct guess starts the chase.</li>
       <li><strong>BMW!</strong> Call one of the shown names within 20 seconds and its owner runs next. The first runner gets a head start; relays briefly protect the next runner while the chase continues. Active safe spots protect everyone from tags. A timeout, tag outside safety or boundary crossing puts you out.</li></ol>
      </details>
     </div>
    </section>

    {/* Right Column: Adda Creation & Room Join */}
    <section className="hero-right">
     <div className="adda-card">
      <h3 className="adda-heading">Play Chicklets</h3>

      {/* Form children passed from App.tsx */}
      <div className="adda-form-container">
       {children}
      </div>
     </div>
    </section>
   </div>

   {/* Footer: Authentic Truck-Art Ribbon */}
  </main>
 </div>;
}

const beats=[
 {speaker:'DENNER',line:'“Are you Maruti?”',action:'Knock on Chintu'},
 {speaker:'CHINTU · MARUTI',line:'“Catch me first.”',action:'Call BMW!'},
 {speaker:'GUDIYA · BMW',line:'“I was literally just standing here.”',action:'Play it again'}
] as const;

function StreetDemo(){
 const [beat,setBeat]=useState(0);
 const {speaker,line,action}=beats[beat];
 return <section className={'gali-demo beat-'+beat} aria-label="Try a practice knock">
  <div className="gali-dialogue" aria-live="polite"><small>{speaker}</small><strong>{line}</strong></div>
  <div className="gali-cast" aria-hidden="true">{['denner','chintu','gudiya'].map(kid=><span key={kid} className={'gali-kid '+kid}><span/></span>)}</div>
  <button type="button" onClick={()=>{if(beat===0)sounds.playKnock();setBeat((beat+1)%beats.length)}}>{action} <span aria-hidden="true">↗</span></button>
 </section>
}
