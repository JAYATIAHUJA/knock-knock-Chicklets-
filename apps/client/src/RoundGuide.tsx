import {useEffect,useState} from 'react';
import {type PublicRoom} from '@chicklets/shared';
import {serverNow} from './serverClock';

export function RoundGuide({room,id,identity}:{room:PublicRoom;id:string;identity:string|null}){
 const [now,setNow]=useState(serverNow());
 useEffect(()=>{const timer=setInterval(()=>setNow(serverNow()),250);return()=>clearInterval(timer)},[]);
 const denner=room.dennerId===id;
 const runnerName=room.players.find(p=>p.id===room.runnerId)?.name??'the runner';
 const wait=Math.max(0,Math.ceil(((room.chaseStartsAt??0)-now)/1000));
 const remaining=Math.max(0,Math.ceil(((room.relayDeadline??0)-now)/1000));
 const hint=room.phase==='guessing'
  ?denner?'Approach a player · press E to guess':'Keep your secret · wait for a knock'
  :room.phase==='chase'
   ?denner?wait?`Chase starts in ${wait}s`:`Tag ${runnerName} · ${remaining}s left`:`Find a safe spot · ${remaining}s left`
   :'';
 if(!hint)return null;
 return <div className="round-guide" role="status"><span>{hint}</span>{room.phase==='guessing'&&identity&&!denner&&<strong>Secret: {identity}</strong>}</div>;
}
