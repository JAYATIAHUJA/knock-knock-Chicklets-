import {useEffect,useRef} from 'react';
import {canMove,type PublicRoom} from '@chicklets/shared';
import {socket} from './network';

export function Controls({room,id}:{room:PublicRoom;id:string}){
 const pressed=useRef(new Set<string>()),touch=useRef(new Set<string>()),seq=useRef(Date.now());
 const allowed=canMove(room.phase,id,room.dennerId,room.runnerId);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName))return;pressed.current.add(e.key.toLowerCase());if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault()};
  const up=(e:KeyboardEvent)=>pressed.current.delete(e.key.toLowerCase());
  const blur=()=>{pressed.current.clear();touch.current.clear()};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  const timer=setInterval(()=>{const keys=new Set([...pressed.current,...touch.current]);const dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));socket.emit('input',{seq:++seq.current,dx,dz,sprint:keys.has('shift')})},1000/30);
  return()=>{clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur)}
 },[]);
 const button=(key:string,label:string,style?:string)=><button className={`pad-key ${style||''}`} aria-label={label} disabled={!allowed} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch.current.add(key)}} onPointerUp={()=>touch.current.delete(key)} onPointerCancel={()=>touch.current.delete(key)} onLostPointerCapture={()=>touch.current.delete(key)}>{label}</button>;
 return <><div className="controls">{allowed?'WASD / ARROWS to move · SHIFT to sprint':'Movement locked this phase'}</div><div className="touch-controls"><div className="dpad">{button('w','↑','up')}{button('a','←','left')}{button('s','↓','down')}{button('d','→','right')}</div>{button('shift','RUN','run')}</div></>
}
