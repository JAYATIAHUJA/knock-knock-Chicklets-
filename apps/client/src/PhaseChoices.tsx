import {CATEGORIES,type PublicRoom} from '@chicklets/shared';

type Props={room:PublicRoom;id:string;identity:string|null;act:(event:string,value:unknown)=>Promise<void>};

export function PhaseChoices({room,id,identity,act}:Props){
 if(room.phase!=='category'&&room.phase!=='identity')return null;
 const denner=room.dennerId===id;
 const choosing=room.phase==='category'?denner:!denner&&!identity;
 const title=room.phase==='category'?(denner?'Choose a category':'The Denner is choosing'):
  denner?'Players are choosing their secrets':identity?'Your secret is ready':`Choose your secret ${room.category?.toLowerCase()}`;
 const names=room.phase==='category'?Object.keys(CATEGORIES):room.category?CATEGORIES[room.category]:[];
 return <div className="phase-choice-stage">
  <section className="phase-choice-card" aria-labelledby="phase-choice-title">
   <p className="eyebrow">{room.phase==='category'?'ROUND SETUP':'YOUR PRIVATE CHOICE'}</p>
   <h2 id="phase-choice-title">{title}</h2>
   <p>{room.phase==='category'?(denner?'Everyone will choose a secret from this category.':'Get ready to choose your secret name.'):
    denner?'Their choices stay hidden from you.':identity?'Waiting for the other players. Remember this name.':'Pick one name. The Denner cannot see your choice.'}</p>
   {choosing&&<div className="guess-grid">{names.map(name=><button key={name} onClick={()=>void act(room.phase==='category'?'category':'identity',name)}>{name}</button>)}</div>}
   {room.phase==='identity'&&!denner&&identity&&<div className="chosen-secret"><small>YOUR SECRET</small><strong>{identity}</strong></div>}
  </section>
 </div>;
}
