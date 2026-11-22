import {useEffect,useRef,useState} from 'react';
import {type PublicRoom} from '@chicklets/shared';
import {sounds} from './sound';
import {serverNow} from './serverClock';

type Props={room:PublicRoom;id:string;callNames:string[];act:(event:string,value:unknown)=>Promise<void>};
export function KnockPlay({room,id,callNames,act}:Props){
 const [reply,setReply]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(12);
 const knock=room.knock;
 const callPending=useRef(false);
 const canPass=callNames.length>0;
 const [now,setNow]=useState(serverNow());
 useEffect(()=>{const timer=setInterval(()=>setNow(serverNow()),100);return()=>clearInterval(timer)},[]);
 const headStart=Math.max(0,Math.ceil(((room.chaseStartsAt??0)-now)/1000));
 const protection=Math.max(0,Math.ceil(((room.players.find(p=>p.id===id)?.catchGraceUntil??0)-now)/1000));
 const remaining=Math.max(0,Math.ceil(((room.relayDeadline??0)-now)/1000));
 const frozen=now<(room.players.find(p=>p.id===id)?.freezeUntil??0);

 async function shout(name:string){
  if(callPending.current)return;
  callPending.current=true;

  try{await act('call-name',name)}finally{callPending.current=false}
 }

 useEffect(()=>{
  if(room.phase!=='chase'||room.runnerId!==id||!canPass||frozen)return;
  const call=(event:KeyboardEvent)=>{
   if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||(event.target instanceof HTMLElement&&(event.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))))return;
   const name=callNames[Number(event.key)-1];
   if(/^[1-7]$/.test(event.key)&&name){event.preventDefault();void shout(name)}
  };
  window.addEventListener('keydown',call);return()=>window.removeEventListener('keydown',call);
 },[room.phase,room.runnerId,room.category,id,callNames,canPass,frozen,act]);

 useEffect(()=>{
  setReply('');setBusy(false);
  if(!knock)return;
  sounds.playKnock();
  const update=()=>setSeconds(Math.max(0,Math.ceil((knock.expiresAt-serverNow())/1000)));
  update();
  const timer=setInterval(update,250);
  return()=>clearInterval(timer);
 },[knock?.id]);

 async function respond(text:string){if(!knock||busy)return;setBusy(true);try{await act('knock-reply',{knockId:knock.id,text})}finally{setBusy(false)}}

 if(knock){
  const addressed=knock.targetId===id,denner=knock.dennerId===id;
  const target=room.players.find(p=>p.id===knock.targetId)?.name;
  const asker=room.players.find(p=>p.id===knock.dennerId)?.name;
  return <div className={`knock-stage ${addressed||!denner?'addressed':''}`} role={addressed?'dialog':'status'} aria-modal={addressed||undefined} aria-label="Knock knock">
   <div className="knock-card" key={knock.id}>
    <span className="knock-tap" aria-hidden="true">Knock knock!</span>
    <p className="knock-from">{addressed?`${asker} knocked on your back`:denner?`${target} got your guess…`:`${asker} → ${target}`}</p>
    <h2 className="gali-question">“Are you {knock.name}?”</h2>
    {addressed?<><p className="knock-help">Give them a comeback. The game checks the guess.</p><div className="banter-options">{['Catch me first.'].map(text=><button key={text} disabled={busy} onClick={()=>respond(text)}>{text}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();void respond(reply)}}><label htmlFor="knock-reply">Your comeback</label><div className="reply-row"><input id="knock-reply" autoFocus maxLength={120} value={reply} onChange={event=>setReply(event.target.value)} placeholder="Your version of events…"/><button disabled={busy||!reply.trim()} type="submit">Send →</button></div></form>
     </>:<p className="knock-help">{target} is thinking of a comeback…</p>}
    <small>{seconds}s · until the guess is checked</small>
   </div>
  </div>;
 }
 if(room.phase==='chase'&&room.runnerId===id&&room.category){
  return <section className="shout-panel" aria-label="Call another secret name">
   <h2>Your turn to run</h2><p>{frozen?'Frozen briefly · move and relay when it ends.':headStart?`Head start: ${headStart}s. Denner is waiting.`:protection?`Protected from tags for ${protection}s. Keep running.`:'Keep moving. Safe spots protect you from tags.'} Relay in {remaining}s.</p><p>{canPass?'Call one of these names to pass the chase.':'No connected player is available for a relay. Keep running until the timer ends.'}</p>
   {canPass&&<><div className="shout-options">{callNames.map((name,index)=><button key={name} disabled={frozen} onPointerDown={event=>event.preventDefault()} onClick={()=>void shout(name)}><kbd>{index+1}</kbd> {name}!</button>)}</div><small className="shout-hint">WASD to run · Press 1–7 or tap a name</small></>}
  </section>;
 }
 return null;
}
