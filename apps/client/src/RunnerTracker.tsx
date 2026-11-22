import {ARENA,type PublicRoom} from '@chicklets/shared';

const coord=(value:number)=>Math.max(6,Math.min(194,100+value/ARENA*94));

export function RunnerTracker({room,id}:{room:PublicRoom;id:string}){
 if(room.phase!=='chase'||room.dennerId!==id)return null;
 const denner=room.players.find(p=>p.id===room.dennerId);
 const runner=room.players.find(p=>p.id===room.runnerId);
 if(!denner||!runner)return null;
 return <aside className="chase-map" aria-label="Courtyard map">
  <strong>COURTYARD MAP</strong>
  <svg viewBox="0 0 200 200" role="img" aria-label={`${denner.name} is chasing ${runner.name}`}>
   <rect x="5" y="5" width="190" height="190" rx="4" className="map-ground"/>
   <path d="M100 6V194M6 100H194" className="map-lanes"/>
   {room.safeZones?.map(zone=><circle key={zone.id} cx={coord(zone.x)} cy={coord(zone.z)} r={zone.radius/ARENA*94} className="map-safe"/>)}
   {room.powerup&&room.powerup.availableAt<=(room.serverTime??0)&&<circle cx={coord(room.powerup.x)} cy={coord(room.powerup.z)} r="5" className="map-powerup"/>}
   <circle cx={coord(denner.position.x)} cy={coord(denner.position.z)} r="8" className="map-denner"/>
   <circle cx={coord(runner.position.x)} cy={coord(runner.position.z)} r="8" className="map-runner"/>
  </svg>
  <div className="map-legend"><span><i className="map-denner"/>{denner.name} · Denner</span><span><i className="map-runner"/>{runner.name} · Runner</span></div>
 </aside>;
}
