import {useEffect,useRef,useState} from 'react';
import {canMove,type PublicRoom} from '@chicklets/shared';
import {socket} from './network';
import {sounds} from './sound';
import {serverNow} from './serverClock';

export const localMotionInput={seq:Date.now(),dx:0,dz:0,sprint:false};

export function Controls({room,id}:{room:PublicRoom;id:string}){
 const pressed=useRef(new Set<string>()),touch=useRef(new Set<string>());
 const refreshInput=useRef<()=>void>(()=>{});
 const me=room.players.find(p=>p.id===id);
 const frozen=serverNow()<(me?.freezeUntil??0);
 const allowed=!frozen&&canMove(room.phase,id,room.dennerId,room.runnerId,room.chaseStartsAt??0,serverNow());
 const stamina=Math.round(me?.stamina??100);
 const energy=useRef(stamina);
 energy.current=stamina;
 const lastStep=useRef(0);

 useEffect(()=>{
  const update=()=>{
   const keys=new Set([...pressed.current,...touch.current]);
   const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
   const dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
   const moving=dx!==0||dz!==0;
   const sprint=keys.has('shift')&&moving&&energy.current>8;
   Object.assign(localMotionInput,{dx:allowed?dx:0,dz:allowed?dz:0,sprint:allowed&&sprint});
   return {moving,sprint};
  };
  refreshInput.current=()=>{update()};
  const down=(e:KeyboardEvent)=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;pressed.current.add(e.key.toLowerCase());update();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()};
  const up=(e:KeyboardEvent)=>{pressed.current.delete(e.key.toLowerCase());update()};
  const blur=()=>{pressed.current.clear();touch.current.clear();Object.assign(localMotionInput,{dx:0,dz:0,sprint:false})};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);

  const timer=setInterval(()=>{
   const {moving,sprint}=update();

   // Footstep SFX when moving
   const now=Date.now();
   if(allowed&&moving&&now-lastStep.current>(sprint?240:370)){
    sounds.playFootstep();
    lastStep.current=now;
   }

   if(allowed)socket.emit('input',{...localMotionInput});
  },1000/30);

  return()=>{Object.assign(localMotionInput,{dx:0,dz:0,sprint:false});refreshInput.current=()=>{};clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}
 },[allowed]);

 const button=(key:string,label:string,style?:string)=><button className={`pad-key ${style||''}`} aria-label={label} disabled={!allowed} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch.current.add(key);refreshInput.current()}} onPointerUp={()=>{touch.current.delete(key);refreshInput.current()}} onPointerCancel={()=>{touch.current.delete(key);refreshInput.current()}} onLostPointerCapture={()=>{touch.current.delete(key);refreshInput.current()}}>{label}</button>;

 return <>
  <div className="controls desi-controls">
   <div className="controls-label">{frozen?'Frozen briefly':allowed?'WASD / ARROWS to move · SHIFT to sprint':'Movement locked this phase'}</div>
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
  {allowed&&<div className="touch-controls">
   <div className="dpad">{button('w','↑','up')}{button('a','←','left')}{button('s','↓','down')}{button('d','→','right')}</div>
   {button('shift','RUN','run')}
  </div>}
 </>;
}
