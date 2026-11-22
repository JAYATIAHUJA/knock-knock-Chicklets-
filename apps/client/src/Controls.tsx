import {useEffect,useRef,useState} from 'react';
import {canMove,type PublicRoom} from '@chicklets/shared';
import {socket} from './network';
import {sounds} from './sound';

export const localMotionInput={seq:0,dx:0,dz:0,sprint:false};

export function Controls({room,id}:{room:PublicRoom;id:string}){
 const pressed=useRef(new Set<string>()),touch=useRef(new Set<string>()),seq=useRef(Date.now());
 const allowed=canMove(room.phase,id,room.dennerId,room.runnerId,room.chaseStartsAt??0);
 const me=room.players.find(p=>p.id===id);
 const stamina=Math.round(me?.stamina??100);
 const energy=useRef(stamina);
 energy.current=stamina;
 const lastStep=useRef(0);

 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;pressed.current.add(e.key.toLowerCase());if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()};
  const up=(e:KeyboardEvent)=>pressed.current.delete(e.key.toLowerCase());
  const blur=()=>{pressed.current.clear();touch.current.clear();Object.assign(localMotionInput,{dx:0,dz:0,sprint:false})};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);

  const timer=setInterval(()=>{
   const keys=new Set([...pressed.current,...touch.current]);
   const rawDx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
   const rawDz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
   const moving=rawDx!==0||rawDz!==0;
   const wantSprint=keys.has('shift')&&moving;

   const actualSprint=wantSprint&&energy.current>8;

   // Footstep SFX when moving
   const now=Date.now();
   if(allowed&&moving&&now-lastStep.current>(actualSprint?240:370)){
    sounds.playFootstep();
    lastStep.current=now;
   }

   Object.assign(localMotionInput,{seq:++seq.current,dx:allowed?rawDx:0,dz:allowed?rawDz:0,sprint:actualSprint});
   if(allowed)socket.emit('input',localMotionInput);
  },1000/30);

  return()=>{Object.assign(localMotionInput,{dx:0,dz:0,sprint:false});clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}
 },[allowed]);

 const button=(key:string,label:string,style?:string)=><button className={`pad-key ${style||''}`} aria-label={label} disabled={!allowed} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch.current.add(key)}} onPointerUp={()=>touch.current.delete(key)} onPointerCancel={()=>touch.current.delete(key)} onLostPointerCapture={()=>touch.current.delete(key)}>{label}</button>;

 return <>
  <div className="controls desi-controls">
   <div className="controls-label">{allowed?'WASD / ARROWS to move · SHIFT to sprint':'Movement locked this phase'}</div>
   {allowed&&<div className="chai-stamina-container" title={`Sprint stamina: ${stamina}%`}>
    <div className="chai-glass">
      <div className="chai-liquid" style={{height:`${stamina}%`}}/>
      <div className="chai-stripes"/>
    </div>
    <div className="chai-meter-wrapper">
      <div className="chai-label-row">
        <span>SPRINT STAMINA</span>
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
