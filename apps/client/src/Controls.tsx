import {useEffect,useRef,useState} from 'react';
import {canMove,type PublicRoom} from '@chicklets/shared';
import {socket} from './network';
import {sounds} from './sound';

export function Controls({room,id}:{room:PublicRoom;id:string}){
 const pressed=useRef(new Set<string>()),touch=useRef(new Set<string>()),seq=useRef(Date.now());
 const allowed=canMove(room.phase,id,room.dennerId,room.runnerId);
 const [stamina,setStamina]=useState(100);
 const staminaRef=useRef(100);
 const lastStep=useRef(0);

 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;pressed.current.add(e.key.toLowerCase());if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()};
  const up=(e:KeyboardEvent)=>pressed.current.delete(e.key.toLowerCase());
  const blur=()=>{pressed.current.clear();touch.current.clear()};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);

  const timer=setInterval(()=>{
   const keys=new Set([...pressed.current,...touch.current]);
   const rawDx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
   const rawDz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
   const moving=rawDx!==0||rawDz!==0;
   const wantSprint=keys.has('shift')&&moving;

   // Stamina management: sprint depletes stamina, jog/rest regenerates
   if(wantSprint&&staminaRef.current>5){
    staminaRef.current=Math.max(0,staminaRef.current-2.2);
   }else{
    staminaRef.current=Math.min(100,staminaRef.current+1.1);
   }
   setStamina(Math.round(staminaRef.current));
   const actualSprint=wantSprint&&staminaRef.current>0;

   // Footstep SFX when moving
   const now=Date.now();
   if(allowed&&moving&&now-lastStep.current>(actualSprint?240:370)){
    sounds.playFootstep();
    lastStep.current=now;
   }

   socket.emit('input',{seq:++seq.current,dx:rawDx,dz:rawDz,sprint:actualSprint});
  },1000/30);

  return()=>{clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}
 },[allowed]);

 const button=(key:string,label:string,style?:string)=><button className={`pad-key ${style||''}`} aria-label={label} disabled={!allowed} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch.current.add(key)}} onPointerUp={()=>touch.current.delete(key)} onPointerCancel={()=>touch.current.delete(key)} onLostPointerCapture={()=>touch.current.delete(key)}>{label}</button>;

 return <>
  <div className="controls desi-controls">
   <div className="controls-label">{allowed?'WASD / ARROWS to move · SHIFT to sprint':'Movement locked this phase'}</div>
   {allowed&&<div className="chai-stamina-container" title={`Cutting Chai Stamina: ${stamina}%`}>
    <div className="chai-glass">
      <div className="chai-liquid" style={{height:`${stamina}%`}}/>
      <div className="chai-stripes"/>
      <div className="chai-steam">♨</div>
    </div>
    <div className="chai-meter-wrapper">
      <div className="chai-label-row">
        <span>CUTTING CHAI POWER</span>
        <b>{stamina}%</b>
      </div>
      <div className="stamina-track">
        <div className="stamina-bar" style={{width:`${stamina}%`,background:stamina<25?'#e84d38':stamina<50?'#f59e0b':'#d97706'}}/>
      </div>
    </div>
   </div>}
  </div>
  <div className="touch-controls">
   <div className="dpad">{button('w','↑','up')}{button('a','←','left')}{button('s','↓','down')}{button('d','→','right')}</div>
   {button('shift','RUN','run')}
  </div>
 </>;
}
