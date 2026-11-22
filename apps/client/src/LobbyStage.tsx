import {type PublicRoom} from '@chicklets/shared';

export function LobbyStage({room,id,onReady}:{room:PublicRoom;id:string;onReady:()=>void}){
 if(room.phase!=='lobby')return null;
 const me=room.players.find(p=>p.id===id);
 const ready=room.players.filter(p=>p.ready).length;
 return <div className="phase-choice-stage lobby-stage">
  <section className="phase-choice-card" aria-labelledby="lobby-title">
   <p className="eyebrow">ROOM {room.code}</p>
   <h2 id="lobby-title">Gather the gang</h2>
   <p>{room.players.length<room.minPlayers?`Waiting for ${room.minPlayers-room.players.length} more player${room.minPlayers-room.players.length===1?'':'s'}.`:`${ready} of ${room.players.length} ready. Start when everyone is ready.`}</p>
   <div className="lobby-roster" aria-label="Players">{room.players.map(p=><div key={p.id}><span className="player-dot" style={{background:p.color}}/>{p.name}{p.id===id?' (you)':''}<strong>{!p.connected?'OFFLINE':p.ready?'READY':'WAITING'}</strong></div>)}</div>
   <button className="primary lobby-ready" onClick={onReady}>{me?.ready?'CANCEL READY':'I’M READY'}</button>
  </section>
 </div>;
}
