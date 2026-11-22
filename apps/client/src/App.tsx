import {useEffect,useState,useRef} from 'react';
import {CATEGORIES} from '@chicklets/shared';
import {socket,send,saveSession} from './network';
import {useGame} from './store';
import {Scene} from './scene';
import {RoundGuide} from './RoundGuide';
import {KnockPlay} from './KnockPlay';
import {Landing} from './Landing';
import {PhaseChoices} from './PhaseChoices';
import {RoundRecap} from './RoundRecap';
import {RunnerTracker} from './RunnerTracker';
import {sounds} from './sound';

const colors=['#db7857','#6b9b78','#d4a047','#8296bd','#ae82a6','#79aeb2'];

export default function App(){
 const {room,playerId,identity,callNames,error,setError}=useGame();
 const [name,setName]=useState(localStorage.getItem('chicklets-name')||'Rookie');
 const [color,setColor]=useState(colors[0]);
 const [code,setCode]=useState(new URLSearchParams(location.search).get('room')||'');
 const [dev,setDev]=useState(false);
 const [bots,setBots]=useState(2);
 const [waitForFriends,setWaitForFriends]=useState(false);
 const [guessTarget,setGuessTarget]=useState<string|null>(null);
 const [copied,setCopied]=useState(false);
 const [busy,setBusy]=useState(false);


 // Round recap state
 const [recap,setRecap]=useState<null|{
  runnerName:string;dennerName:string;newDennerName:string;
  chain:string[];survivalMs:number;relayCount:number;catchReason:string;
 }>(null);

 // Track phase & chase data for recap
 const lastPhase=useRef<string>('');
 const chaseData=useRef({
  runnerId:'',dennerName:'',runnerName:'',
  chain:[] as string[],startedAt:0,relayCount:0,
 });

 const me=room?.players.find(p=>p.id===playerId);
 const isDenner=playerId===room?.dennerId;
 const nearby=room?.players.filter(p=>p.id!==playerId&&me&&p.connected&&Math.hypot(p.position.x-me.position.x,p.position.z-me.position.z)<=2.5)
  .sort((a,b)=>Math.hypot(a.position.x-me!.position.x,a.position.z-me!.position.z)-Math.hypot(b.position.x-me!.position.x,b.position.z-me!.position.z))||[];

 useEffect(()=>{
  if(!room)return;
  const prev=lastPhase.current;
  const curr=room.phase;
   // Clear the previous recap when the next round begins.
  if(curr==='category'&&curr!==prev)setRecap(null);

  // ── CHASE: start tracking survival time ───────────────────
  if(curr==='chase'&&prev!=='chase'){
   const denner=room.players.find(p=>p.id===room.dennerId);
   const runner=room.players.find(p=>p.id===room.runnerId);
   chaseData.current={
    runnerId:room.runnerId??'',
    dennerName:denner?.name??'?',
    runnerName:runner?.name??'?',
    chain:[runner?.name??"Runner"],startedAt:Date.now(),
    relayCount:0,
   };
   sounds.playChaseAlert();
  }

  // Count relay transfers during chase
  if(curr==='chase'&&prev==='chase'&&room.runnerId&&room.runnerId!==chaseData.current.runnerId){
   sounds.playRelayTransfer();
   chaseData.current.relayCount++;
   chaseData.current.runnerId=room.runnerId;
   chaseData.current.runnerName=room.players.find(p=>p.id===room.runnerId)?.name??chaseData.current.runnerName;
   chaseData.current.chain.push(chaseData.current.runnerName);
  }

  // ── CAUGHT: show round recap ────────────────────────────
  if(curr==='caught'&&prev!=='caught'){
   sounds.playTagImpact();
   sounds.playRecapStinger();
   const survivedMs=chaseData.current.startedAt>0?Date.now()-chaseData.current.startedAt:0;
   const newDenner=room.players.find(p=>p.id===room.dennerId);
   setRecap({
    runnerName:chaseData.current.runnerName||'Runner',
    dennerName:chaseData.current.dennerName||'Denner',
    newDennerName:newDenner?.name??'?',
    survivalMs:survivedMs,chain:[...chaseData.current.chain],
    relayCount:chaseData.current.relayCount,
    catchReason:room.message,
   });
   chaseData.current.startedAt=0;
  }

  lastPhase.current=curr;
 },[room?.phase,room?.runnerId,room?.dennerId,room?.message]);

 useEffect(()=>{const fn=()=>setError('Connection lost. Reconnecting…');socket.on('disconnect',fn);return()=>{socket.off('disconnect',fn)}},[setError]);

 async function enter(kind:'create'|'join'){
  if(busy)return;setBusy(true);
  try{
   setError('');
   localStorage.setItem('chicklets-name',name);
   const session=await send(kind,kind==='create'?{name,color,dev,bots}:{name,color,code:code.trim().toUpperCase()}) as {code:string;token:string;playerId:string};
   saveSession(session);
   if(kind==='create'&&bots>0&&!waitForFriends)await send('ready',true);
   if(kind==='create'){history.replaceState(null,'',`?room=${session.code}`);setCode(session.code)}
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  setBusy(false);
 }

 async function act(event:string,value:unknown){
  try{setError('');await send(event,value);if(event==='guess')setGuessTarget(null)}
  catch(e){setError(e instanceof Error?e.message:String(e))}
 }

 useEffect(()=>{
  if(room?.phase!=='guessing'||!isDenner)return;
  const knock=(event:KeyboardEvent)=>{
   if(event.repeat||['INPUT','TEXTAREA','SELECT','BUTTON'].includes((event.target as HTMLElement)?.tagName))return;
   if((event.code==='Space'||event.code==='KeyE')&&nearby[0]){event.preventDefault();setGuessTarget(nearby[0].id)}
  };
  window.addEventListener('keydown',knock);
  return()=>window.removeEventListener('keydown',knock);
 },[room?.phase,isDenner,nearby[0]?.id]);
 useEffect(()=>{if(room?.phase!=='guessing')setGuessTarget(null)},[room?.phase]);
 const url=room?`${location.origin}?room=${room.code}`:'';

 return <div className={`app ${room?'in-game':''} ${room?.phase==='caught'?'caught-flash':''}`} aria-busy={busy}>
  <header>
   <div className="brand"><div><strong>CHICKLETS</strong><small>The secret-name chase</small></div></div>
   <span className="top-note">THE NEIGHBORHOOD CHASE</span>
   {room&&<div className="room-code">ROOM <b>{room.code}</b><button onClick={async()=>{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1800)}}>{copied?'COPIED!':'COPY LINK'}</button></div>}
  </header>

  {!room?<Landing onPlay={()=>void enter('create')}>
   <div className="join-card">
    <label>Your nickname<input maxLength={20} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Chintu"/></label>
    <details className="room-settings"><summary>Room settings</summary>
    <div className="color-label">Pick your colour</div>
    <div className="swatches">{colors.map(c=><button aria-label={`Choose ${c}`} className={c===color?'selected':''} style={{background:c}} onClick={()=>setColor(c)} key={c}/>)}</div>
    <fieldset className="play-mode">
     <legend>Pick your crew</legend>
     <div>{[[0,"Friends"],[2,"2 computer friends"],[3,"3 computer friends"]].map(([value,label])=><button key={value} type="button" aria-pressed={bots===value} onClick={()=>setBots(Number(value))}>{label}</button>)}</div>
     <p>{bots?"Start with computer players or invite friends first.":"Create a room and send the link to your friends."}</p>
    </fieldset>
    {bots>0&&<label><input type="checkbox" checked={waitForFriends} onChange={e=>setWaitForFriends(e.target.checked)}/> Wait for friends in the lobby</label>}
    <label className="dev" hidden={bots>0}><input type="checkbox" checked={dev} onChange={e=>setDev(e.target.checked)}/> Practice with 2–4 friends <span>(full game: 5–8 players)</span></label>
    </details>
    <div className="join-actions">
     <button className="primary" onClick={()=>enter('create')} disabled={busy||!name.trim()}>{bots?"PLAY":"CREATE ROOM"} <span>↗</span></button>
     <div className="join-inline"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="ROOM CODE" maxLength={6}/><button onClick={()=>enter('join')} disabled={busy||!name.trim()||!code.trim()}>JOIN →</button></div>
    </div>

   </div>
  </Landing>

  :<main className={"game-layout phase-"+room.phase}>
   <section className="game-panel">
    <div className="scene-overlay"><span className="phase-chip">{room.phase.toUpperCase()}</span><strong>{room.message}</strong></div>
    <Scene room={room} id={playerId}/>
    <RunnerTracker room={room} id={playerId}/>
    {room.phase==='guessing'&&room.message.startsWith('Wrong guess')&&<div className="guess-result" role="status">{room.message}</div>}
    {(room.phase==='lobby'||room.phase==='guessing'||(room.phase==='chase'&&room.runnerId!==playerId))&&!guessTarget&&<RoundGuide room={room} id={playerId} identity={identity}/>}
    {room.phase==='guessing'&&isDenner&&nearby[0]&&!guessTarget&&<button className="nearby-knock" onClick={()=>setGuessTarget(nearby[0].id)}>Knock on {nearby[0].name} <kbd>E / Space</kbd></button>}
   </section>
   {room.phase==='lobby'&&<aside className="sidebar">
    <div className="side-heading">
     <span>THE COURTYARD</span>
     <h2>{room.phase==='lobby'?'Gather the gang':room.phase==='chase'?'Run, run, run!':room.phase==='caught'?'Caught!':'The game is on'}</h2>
     <p>{room.phase==='lobby'?`Everyone ready? ${room.minPlayers} players needed to start.`:room.phase==='identity'?'Your choice is yours alone. The DENNER cannot see it.':room.phase==='guessing'?'DENNER walks up to a friend and guesses their secret.':room.phase==='chase'?'Runner: call a secret. Everyone else: reach a safe spot.':room.message}</p>
    </div>
    <div className="player-list">
     <div className="section-title">PLAYERS <span>{room.players.length}/8</span></div>
     {room.players.map(p=><div key={p.id} className={`player-row ${p.connected?'':'offline'}`}><span className="player-dot" style={{background:p.color}}/><span>{p.name}{p.bot?' · computer':p.id===playerId?' (you)':''}</span><small>{!p.connected?'RECONNECTING':room.phase==='lobby'?(p.ready?'READY':'WAITING'):p.role==='denner'?'DENNER':p.role==='runner'?'RUNNER':'PLAYER'}</small></div>)}
    </div>
    {room.phase==='lobby'&&<button className="primary wide" onClick={()=>act('ready',!me?.ready)}>{me?.ready?'CANCEL READY':'I\'M READY'}</button>}
    <div className="side-bottom">WASD / ARROWS TO MOVE · SHIFT TO SPRINT<br/>Made for friends, shared screens, and old streets.</div>
   </aside>}
  </main>}

  {room&&<PhaseChoices room={room} id={playerId} identity={identity} act={act}/>}
  {room&&<KnockPlay room={room} id={playerId} callNames={callNames} act={act}/>}

  {/* Round recap */}
  {room&&recap&&room.phase==='caught'&&<RoundRecap {...recap}/>}

  {error&&<div className="toast" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
  {guessTarget&&room?.phase==='guessing'&&room.category&&<div className="modal-shade" onClick={()=>setGuessTarget(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setGuessTarget(null)}>×</button><p className="eyebrow">MAKE A GUESS</p><h2>Are you…?</h2><p>{room.players.find(p=>p.id===guessTarget)?.name} is listening. Pick your guess.</p><div className="guess-grid">{CATEGORIES[room.category].map(v=><button key={v} onClick={()=>act('guess',{targetId:guessTarget,identity:v})}>{v}</button>)}</div></div></div>}
 </div>
}
