import {useEffect,useRef,useState} from 'react';
import {CATEGORIES,type PublicRoom} from '@chicklets/shared';

type Props={room:PublicRoom;id:string;identity:string|null;act:(event:string,value:unknown)=>Promise<void>};
export function KnockPlay({room,id,identity,act}:Props){
 const [reply,setReply]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(12);
 const knock=room.knock;
 const callPending=useRef(false);
 const canPass=room.players.some(p=>p.connected&&p.id!==id&&p.id!==room.dennerId);
 const callNames=room.category?CATEGORIES[room.category].filter(name=>name!==identity):[];
 async function shout(name:string){if(callPending.current)return;callPending.current=true;try{await act('call-name',name)}finally{callPending.current=false}}
 useEffect(()=>{
  if(room.phase!=='chase'||room.runnerId!==id||!canPass)return;
  const call=(event:KeyboardEvent)=>{
   if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||(event.target instanceof HTMLElement&&(event.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))))return;
   const name=callNames[Number(event.key)-1];
   if(/^[1-7]$/.test(event.key)&&name){event.preventDefault();void shout(name)}
  };
  window.addEventListener('keydown',call);return()=>window.removeEventListener('keydown',call);
 },[room.phase,room.runnerId,room.category,id,identity,canPass,act]);
 useEffect(()=>{setReply('');setBusy(false);if(!knock)return;const update=()=>setSeconds(Math.max(0,Math.ceil((knock.expiresAt-Date.now())/1000)));update();const timer=setInterval(update,250);return()=>clearInterval(timer)},[knock?.id]);
 async function respond(text:string){if(!knock||busy)return;setBusy(true);try{await act('knock-reply',{knockId:knock.id,text})}finally{setBusy(false)}}
 if(knock){
  const addressed=knock.targetId===id,denner=knock.dennerId===id;
  const target=room.players.find(p=>p.id===knock.targetId)?.name;
  const asker=room.players.find(p=>p.id===knock.dennerId)?.name;
  return <div className={`knock-stage ${addressed?'addressed':''}`} role={addressed?'dialog':'status'} aria-modal={addressed||undefined} aria-label="Knock knock">
   <div className="knock-card" key={knock.id}>
    <span className="knock-tap" aria-hidden="true">ठक ठक!</span>
    <p className="knock-from">{addressed?`${asker} ne tumhari peeth par knock kiya`:denner?`${target} se poochha…`:`${asker} → ${target}`}</p>
    <h2>Knock knock!</h2><p className="knock-question">“Kya tum <strong>{knock.name}</strong> ho?”</p>
    {addressed?<><p className="knock-help">Jawab tumhara. Secret ka faisla game karega!</p><div className="banter-options">{['Nahi ji, galat ghar!','Pehle toffee do!','Pakad ke dikha!'].map(text=><button key={text} disabled={busy} onClick={()=>respond(text)}>{text}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();void respond(reply)}}><label htmlFor="knock-reply">Apna jawab</label><div className="reply-row"><input id="knock-reply" autoFocus maxLength={120} value={reply} onChange={event=>setReply(event.target.value)} placeholder="Kuch bhi funny bol…"/><button disabled={busy||!reply.trim()} type="submit">Bolo →</button></div></form>
     </>:<p className="knock-help">{target} ka jawab aa raha hai…</p>}
    <small>{seconds}s · Phir naam check hoga</small>
   </div>
  </div>;
 }
 if(room.phase==='chase'&&room.runnerId===id&&room.category){
  return <section className="shout-panel" aria-label="Call another secret name">
   <h2>Bhaagte bhaagte, naam pukaaro!</h2><p>{canPass?'Sahi naam → ab woh bhaagega. Galat naam → tum out!':'Abhi sirf tum dono ho. Naam pass karne ke liye ek aur dost chahiye.'}</p>
   {canPass&&<><div className="shout-options">{callNames.map((name,index)=><button key={name} onPointerDown={event=>event.preventDefault()} onClick={()=>void shout(name)}><kbd>{index+1}</kbd> {name}!</button>)}</div><small className="shout-hint">WASD se bhaago · 1–7 se naam pukaaro · ya button tap karo</small></>}
  </section>;
 }
 return null;
}
