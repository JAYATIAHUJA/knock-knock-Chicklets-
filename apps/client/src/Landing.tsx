import {useEffect,useRef,useState,type ReactNode} from 'react';
import './landing.css';

const DURATION=3900;

export function Landing({children,joining=false}:{children:ReactNode;joining?:boolean}){
 const [take,setTake]=useState(0);
 const [settled,setSettled]=useState(false);
 const [open,setOpen]=useState(joining);
 const dialog=useRef<HTMLDialogElement>(null);
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
 useEffect(()=>{
  const panel=dialog.current;
  if(open&&!panel?.open)panel?.showModal();
  else if(!open&&panel?.open)panel.close();
 },[open]);
 function skip(){setSettled(true)}
 return <main className={`knock-landing ${settled?'is-settled':''} ${handLoaded?'art-ready':''} ${handFailed?'hand-unavailable':''}`}>
  <nav className="landing-nav" aria-label="Landing controls">
   <span className="landing-signature">बचपन वाला खेल</span>
   <button className="landing-text-button" onClick={()=>setOpen(true)}>Room code hai? <span aria-hidden="true">↗</span></button>
  </nav>
  <section key={take} className="knock-theatre" aria-labelledby="landing-title">
   <div className="knock-copy" aria-hidden="true"><span>knock.</span><span>knock.</span></div>
   <div className="knock-impact impact-one" aria-hidden="true"><i/><i/><i/></div>
   <div className="knock-impact impact-two" aria-hidden="true"><i/><i/><i/></div>
   <div className="landing-wordmark">
    <p className="wordmark-prelude">Knock knock. Kaun hai?</p>
    <h1 id="landing-title" aria-label="Chiklets">{'CHIKLETS'.split('').map((letter,i)=><span key={i} style={{'--letter':i} as React.CSSProperties} aria-hidden="true">{letter}</span>)}<span className="wordmark-dot" aria-hidden="true">✳</span></h1>
    <p className="wordmark-caption">Naam chhupao. Dost bhagao.</p>
   </div>
   <div className="knocking-arm arm-left" aria-hidden="true"><img src="/art/knocking-hand.png" alt="" onLoad={()=>setHandLoaded(true)} onError={()=>setHandFailed(true)} draggable="false"/></div>
   <div className="knocking-arm arm-right" aria-hidden="true"><img src="/art/knocking-hand.png" alt="" draggable="false"/></div>
   <div className="landing-invitation">
    <span className="invitation-line" aria-hidden="true">नीचे आओ, खेलते हैं।</span>
    <button ref={play} className="landing-play" disabled={!settled} onClick={()=>setOpen(true)}>Khelne chalein? <span aria-hidden="true">↗</span></button>
    <p>Apne doston ke saath. Ya 2–3 computer friends ke saath.</p>
   </div>
  </section>
  <footer className="landing-footer">
   <span>Gali ka khel. Ab screen par.</span>
   {!settled?<button onClick={skip}>Skip intro <span aria-hidden="true">→</span></button>:<button onClick={()=>{setSettled(false);setTake(v=>v+1)}}>Phir se knock <span aria-hidden="true">↻</span></button>}
  </footer>
  <dialog ref={dialog} className="landing-join" onCancel={()=>setOpen(false)} onClose={()=>{setOpen(false);play.current?.focus()}} onClick={e=>{if(e.target===dialog.current)setOpen(false)}} aria-labelledby="join-heading">
   <div className="landing-join-inner">
    <button className="landing-close" onClick={()=>setOpen(false)} aria-label="Close play options">×</button>
    <p className="join-handwritten">Aa gaye? Chalo!</p>
    <h2 id="join-heading">Apna adda banao.</h2>
    {children}
   </div>
  </dialog>
 </main>;
}
