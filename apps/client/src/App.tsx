import {useEffect,useState,useRef} from 'react';
import {CATEGORIES,type Category} from '@chicklets/shared';
import {socket,send,saveSession} from './network';
import {useGame} from './store';
import {Scene} from './scene';
import {RoundGuide} from './RoundGuide';
import {KnockPlay} from './KnockPlay';
import {Landing} from './Landing';
import {RoleReveal} from './RoleReveal';
import {RoundRecap} from './RoundRecap';
import {sounds} from './sound';

const colors=['#db7857','#6b9b78','#d4a047','#8296bd','#ae82a6','#79aeb2'];

export default function App(){
 const {room,playerId,identity,error,setError}=useGame();
 const [name,setName]=useState(localStorage.getItem('chicklets-name')||'');
 const [color,setColor]=useState(colors[0]);
 const [code,setCode]=useState(new URLSearchParams(location.search).get('room')||'');
 const [dev,setDev]=useState(false);
 const [bots,setBots]=useState(0);
 const [guessTarget,setGuessTarget]=useState<string|null>(null);
 const [copied,setCopied]=useState(false);
 const [busy,setBusy]=useState(false);

 // Role reveal state
 const [showReveal,setShowReveal]=useState(false);
 const revealShownForRound=useRef('');  // prevent double-firing

 // Round recap state
 const [recap,setRecap]=useState<null|{
  runnerName:string;dennerName:string;newDennerName:string;
  survivalMs:number;relayCount:number;catchReason:string;
 }>(null);

 // Track phase & chase data for recap
 const lastPhase=useRef<string>('');
 const chaseData=useRef({
  runnerId:'',dennerName:'',runnerName:'',
  startedAt:0,relayCount:0,
 });

 const me=room?.players.find(p=>p.id===playerId);
 const isDenner=playerId===room?.dennerId;
 const nearby=room?.players.filter(p=>p.id!==playerId&&me&&p.connected&&Math.hypot(p.position.x-me.position.x,p.position.z-me.position.z)<2.5)||[];

 useEffect(()=>{
  if(!room)return;
  const prev=lastPhase.current;
  const curr=room.phase;
  // ── CATEGORY: Among Us role reveal ─────────────────────────
  if(curr==='category' && curr!==prev){
   const roundKey=room.dennerId??'';
   if(revealShownForRound.current!==roundKey){
    revealShownForRound.current=roundKey;
    setShowReveal(true);
    setRecap(null); // clear old recap
   }
  }

  // ── CHASE: start tracking survival time ───────────────────
  if(curr==='chase'&&prev!=='chase'){
   const denner=room.players.find(p=>p.id===room.dennerId);
   const runner=room.players.find(p=>p.id===room.runnerId);
   chaseData.current={
    runnerId:room.runnerId??'',
    dennerName:denner?.name??'?',
    runnerName:runner?.name??'?',
    startedAt:Date.now(),
    relayCount:0,
   };
   sounds.playChaseAlert();
  }

  // Count relay transfers during chase
  if(curr==='chase'&&prev==='chase'&&room.runnerId&&room.runnerId!==chaseData.current.runnerId){
   chaseData.current.relayCount++;
   chaseData.current.runnerId=room.runnerId;
   chaseData.current.runnerName=room.players.find(p=>p.id===room.runnerId)?.name??chaseData.current.runnerName;
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
    survivalMs:survivedMs,
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
   if(kind==='create'){history.replaceState(null,'',`?room=${session.code}`);setCode(session.code)}
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  setBusy(false);
 }

 async function act(event:string,value:unknown){
  try{setError('');await send(event,value);if(event==='guess')setGuessTarget(null)}
  catch(e){setError(e instanceof Error?e.message:String(e))}
 }

 const url=room?`${location.origin}?room=${room.code}`:'';

 return <div className={`app ${room?'in-game':''} ${room?.phase==='caught'?'caught-flash':''}`} aria-busy={busy}>
  <header>
   <div className="brand"><span className="brand-icon">❋</span><div><strong>CHICKLETS</strong><small>The secret-name chase</small></div></div>
   <span className="top-note">THE NEIGHBORHOOD CHASE</span>
   {room&&<div className="room-code">ROOM <b>{room.code}</b><button onClick={async()=>{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1800)}}>{copied?'COPIED!':'COPY LINK'}</button></div>}
  </header>

  {!room?<Landing>
   <div className="join-card">
    <label>Your nickname<input maxLength={20} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Chintu"/></label>
    <div className="color-label">Pick your colour</div>
    <div className="swatches">{colors.map(c=><button aria-label={`Choose ${c}`} className={c===color?'selected':''} style={{background:c}} onClick={()=>setColor(c)} key={c}/>)}</div>
    <fieldset className="play-mode">
     <legend>Pick your crew</legend>
     <div>{[[0,"Friends"],[2,"2 computer friends"],[3,"3 computer friends"]].map(([value,label])=><button key={value} type="button" aria-pressed={bots===value} onClick={()=>setBots(Number(value))}>{label}</button>)}</div>
     <p>{bots?"Bots are ready. Friends can still join.":"Create a room and send the link to your friends."}</p>
    </fieldset>
    <div className="join-actions">
     <button className="primary" onClick={()=>enter('create')} disabled={busy||!name.trim()}>{bots?"PLAY WITH BOTS":"CREATE ROOM"} <span>↗</span></button>
     <div className="join-inline"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="ROOM CODE" maxLength={6}/><button onClick={()=>enter('join')} disabled={busy||!name.trim()||!code.trim()}>JOIN →</button></div>
    </div>
    <label className="dev" hidden={bots>0}><input type="checkbox" checked={dev} onChange={e=>setDev(e.target.checked)}/> Practice with 2–4 friends <span>(full game: 5–8 players)</span></label>
   </div>
  </Landing>

  :<main className="game-layout">
   <section className="game-panel">
    <div className="scene-overlay"><span className="phase-chip">{room.phase.toUpperCase()}</span><strong>{room.message}</strong></div>
    <Scene room={room} id={playerId}/>
    <RoundGuide room={room} id={playerId} identity={identity}/>
   </section>
   <aside className="sidebar">
    <div className="side-heading">
     <span>THE COURTYARD</span>
     <h2>{room.phase==='lobby'?'Gather the gang':room.phase==='chase'?'Run, run, run!':room.phase==='caught'?'Caught!':'The game is on'}</h2>
     <p>{room.phase==='lobby'?`Everyone ready? ${room.minPlayers} players needed to start.`:room.phase==='identity'?'Your choice is yours alone. The DENNER cannot see it.':room.phase==='guessing'?'DENNER walks up to a friend and guesses their secret.':room.phase==='chase'?'Only the DENNER and runner can move.':room.message}</p>
    </div>
    <div className="player-list">
     <div className="section-title">PLAYERS <span>{room.players.length}/8</span></div>
     {room.players.map(p=><div key={p.id} className={`player-row ${p.connected?'':'offline'}`}><span className="player-dot" style={{background:p.color}}/><span>{p.name}{p.bot?' · computer':p.id===playerId?' (you)':''}</span><small>{!p.connected?'RECONNECTING':room.phase==='lobby'?(p.ready?'READY':'WAITING'):p.role==='denner'?'DENNER':p.role==='runner'?'RUNNER':'PLAYER'}</small></div>)}
    </div>
    {room.phase==='lobby'&&<button className="primary wide" onClick={()=>act('ready',!me?.ready)}>{me?.ready?'CANCEL READY':'I\'M READY'} <span>✦</span></button>}
    {room.phase==='category'&&isDenner&&<div className="action-box"><div className="section-title">CHOOSE A CATEGORY</div>{Object.keys(CATEGORIES).map(c=><button className="option" key={c} onClick={()=>act('category',c as Category)}>{c} <span>→</span></button>)}</div>}
    {room.phase==='identity'&&!isDenner&&<div className="action-box desi-identity-box">
      <div className="section-title">CHOOSE SECRET {room.category?.toUpperCase()}</div>
      {identity?<div className="matchbox-card selected-matchbox">
        <div className="matchbox-striker"/>
        <div className="matchbox-label">
          <span className="matchbox-brand">SECRET TAASH</span>
          <h3 className="matchbox-text">{identity}</h3>
          <small className="matchbox-sub">KISI KO MAT BATAANA!</small>
        </div>
      </div>:(
        <div className="matchbox-grid">
          {(room.category?CATEGORIES[room.category]:[]).map((v, idx)=><button className="matchbox-card" key={v} onClick={()=>act('identity',v)}>
            <div className="matchbox-striker"/>
            <div className="matchbox-label">
              <span className="matchbox-brand">NO. 0{idx+1} · SPECIAL</span>
              <h4 className="matchbox-text">{v}</h4>
              <span className="matchbox-tag">CHUNO ➔</span>
            </div>
          </button>)}
        </div>
      )}
    </div>}
    {room.phase==='identity'&&isDenner&&<p className="note">Waiting for the others to choose...</p>}
    {room.phase==='guessing'&&isDenner&&<div className="action-box"><div className="section-title">NEARBY PLAYERS</div>{nearby.length?nearby.map(p=><button key={p.id} className="option" onClick={()=>setGuessTarget(p.id)}>Knock knock · {p.name}<span>→</span></button>):<p className="note">Walk up to someone to knock.</p>}</div>}
    {room.phase==='chase'&&<div key={room.runnerId} className="relay-ticket" role="status">
      <small>{room.speech?.playerId && room.speech.playerId!==room.runnerId ? room.players.find(p=>p.id===room.speech?.playerId)?.name+' made the call' : 'On the run'}</small>
      <strong>{playerId===room.runnerId?'You’re up!':room.players.find(p=>p.id===room.runnerId)?.name+' is up!'}</strong>
      <span>{isDenner?'Tag the runner before the next call.':playerId===room.runnerId?'Call another player’s secret name.':'Find a safe spot. Listen for your name.'}</span>
    </div>}
    <div className="side-bottom">WASD / ARROWS TO MOVE · SHIFT TO SPRINT<br/>Made for friends, shared screens, and old streets.</div>
   </aside>
  </main>}

  {room&&<KnockPlay room={room} id={playerId} identity={identity} act={act}/>}

  {/* Among Us-style role reveal */}
  {room&&showReveal&&me&&<RoleReveal
   isDenner={isDenner}
   playerColor={me.color}
   playerName={me.name}
   onDone={()=>setShowReveal(false)}
  />}

  {/* Round recap */}
  {room&&recap&&room.phase==='caught'&&<RoundRecap {...recap}/>}

  {error&&<div className="toast" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
  {guessTarget&&room?.category&&<div className="modal-shade" onClick={()=>setGuessTarget(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setGuessTarget(null)}>×</button><p className="eyebrow">MAKE A GUESS</p><h2>Are you…?</h2><p>{room.players.find(p=>p.id===guessTarget)?.name} is listening. Pick your guess.</p><div className="guess-grid">{CATEGORIES[room.category].map(v=><button key={v} onClick={()=>act('guess',{targetId:guessTarget,identity:v})}>{v}</button>)}</div></div></div>}
 </div>
}
