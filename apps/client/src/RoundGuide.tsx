import {useEffect,useState} from 'react';
import {type PublicRoom} from '@chicklets/shared';
export function RoundGuide({room,id,identity}:{room:PublicRoom;id:string;identity:string|null}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t)},[]);
 const denner=room.dennerId===id,runner=room.runnerId===id;
 const stages=['Lobby','Secrets','Knock','Chase'];
 const active=room.phase==='lobby'?0:['category','identity'].includes(room.phase)?1:['guessing','knock'].includes(room.phase)?2:3;
 const title={lobby:'Who’s in?',category:'Pick a category',identity:'Undercover era',guessing:'Who’s bluffing?',knock:'Knock knock.',chase:runner?'Run for it!':denner?'Catch the runner!':'Listen for your name',caught:'Round over'}[room.phase];
 const seconds=room.relayDeadline?Math.max(0,Math.ceil((room.relayDeadline-now)/1000)):0;
 const zones=room.safeZones?.length?` Safe spots: ${room.safeZones.map(z=>z.name).join(', ')}.`:'';
 const detail={lobby:room.players.length<room.minPlayers?'Invite more players to start.':'Ready up to play.',category:denner?'Choose a category for everyone.':'The Denner is choosing a category.',identity:denner?'Everyone else is choosing a secret.':'Pick a unique secret name.',guessing:denner?'Walk up to a player and guess their secret.':'Keep a straight face. A correct guess means you run.',knock:'After the reply, the game checks the guess.',chase:runner?`Call another secret within ${seconds}s.`:denner?`Tag the runner before the handoff. ${seconds}s left.`:`Stay in a safe spot until someone calls your name.${zones}`,caught:'New Denner, fresh secrets.'}[room.phase];
 return <div className="round-guide"><nav aria-label="Round progress">{stages.map((stage,i)=><span className={i===active?'current':i<active?'complete':''} key={stage}><b>{i+1}</b>{stage}</span>)}</nav><h2>{title}</h2><p>{detail}</p>{identity&&!denner&&room.phase!=='caught'&&<div className="secret-reminder"><span>YOUR SECRET</span><strong>{identity}</strong><small>Keep this one off the group chat.</small></div>}</div>
}
