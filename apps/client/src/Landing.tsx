import {useEffect,useRef,useState,type ReactNode} from 'react';
import './landing.css';

const DURATION=3900;

export function Landing({children,joining=false}:{children:ReactNode;joining?:boolean}){
 const [take,setTake]=useState(0);
 const [settled,setSettled]=useState(false);
 const play=useRef<HTMLButtonElement>(null);
 const [handLoaded,setHandLoaded]=useState(false);
 const [handFailed,setHandFailed]=useState(false);

 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||handFailed){setSettled(true);return}
  if(!handLoaded)return;
  setSettled(false);
  const timer=setTimeout(()=>setSettled(true),DURATION);
  return()=>clearTimeout(timer);
 },[take,handLoaded,handFailed]);

 function skip(){setSettled(true)}

 return <main className={`knock-landing ${settled?'is-settled':''} ${handLoaded?'art-ready':''} ${handFailed?'hand-unavailable':''}`}>
  {/* Top Desi Street Header */}
  <nav className="landing-nav" aria-label="Landing controls">
   <div className="desi-badge">
    <span className="landing-signature"> गली नंबर ०४ · बचपन वाला खेल </span>
   </div>
   <div className="landing-nav-right">
    {!settled?<button className="landing-text-button" onClick={skip}>Skip intro <span aria-hidden="true">→</span></button>
    :<button className="landing-text-button" onClick={()=>{setSettled(false);setTake(v=>v+1)}}>Phir se knock <span aria-hidden="true">↻</span></button>}
   </div>
  </nav>

  {/* Main Single-Viewport Stage */}
  <div className="landing-viewport-stage">
   {/* Left/Center Theatre: Animated Knock-Knock */}
   <section key={take} className="knock-theatre" aria-labelledby="landing-title">
    <div className="knock-copy" aria-hidden="true"><span>ठक!</span><span>ठक!</span></div>
    <div className="knock-impact impact-one" aria-hidden="true"><i/><i/><i/></div>
    <div className="knock-impact impact-two" aria-hidden="true"><i/><i/><i/></div>
    
    <div className="landing-wordmark">
     <p className="wordmark-prelude">Knock knock. Kaun hai?</p>
     <h1 id="landing-title" aria-label="Chiklets">
      {'CHIKLETS'.split('').map((letter,i)=><span key={i} style={{'--letter':i} as React.CSSProperties} aria-hidden="true">{letter}</span>)}
      <span className="wordmark-dot" aria-hidden="true">✳</span>
     </h1>
     <p className="wordmark-caption">Naam chhupao. Dost bhagao. Mohalla mein dhappa lagao!</p>
    </div>

    {/* The animated knocking arms */}
    <div className="knocking-arm arm-left" aria-hidden="true"><img src="/art/knocking-hand.png" alt="" onLoad={()=>setHandLoaded(true)} onError={()=>setHandFailed(true)} draggable="false"/></div>
    <div className="knocking-arm arm-right" aria-hidden="true"><img src="/art/knocking-hand.png" alt="" draggable="false"/></div>
   </section>

   {/* Right side: Integrated Adda (Join / Create Card) in the same viewport */}
   <section className="landing-adda-dock">
    <div className="adda-card-frame">
     <div className="adda-card-header">
      <span className="adda-stamp">MOHALLA ADDA</span>
      <h2>Apna Adda Banao</h2>
      <p className="adda-sub">Bina kisi login ke turant shuru karo!</p>
     </div>
     <div className="adda-card-body">
      {children}
     </div>
    </div>
   </section>
  </div>

  {/* Bottom Truck-Art Footer Ribbon */}
  <footer className="landing-footer">
   <div className="footer-ribbon">
    <span>★ BURI NAZAR WAALE TERA MUH KAALA ★ DHEERE CHALNA MANA HAI ★ HORN OK PLEASE ★</span>
   </div>
  </footer>
 </main>;
}
