import {type PublicRoom} from '@chicklets/shared';

export function RunnerTracker({room,id}:{room:PublicRoom;id:string}){
 if(room.phase!=='chase'||room.dennerId!==id)return null;
 const me=room.players.find(p=>p.id===id),runner=room.players.find(p=>p.id===room.runnerId);
 if(!me||!runner)return null;
 const dx=runner.position.x-me.position.x,dz=runner.position.z-me.position.z;
 const degrees=Math.atan2(dx,-dz)*180/Math.PI;
 const distance=Math.round(Math.hypot(dx,dz));
 return <div className="runner-tracker" role="status" aria-label={`Runner ${runner.name}, ${distance} metres away`}>
  <span className="runner-arrow" aria-hidden="true" style={{transform:`rotate(${degrees}deg)`}}>↑</span>
  <span><strong>{runner.name}</strong><small>RUNNER · {distance}m away</small></span>
 </div>;
}
