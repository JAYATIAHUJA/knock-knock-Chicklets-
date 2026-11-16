import {Canvas,useFrame} from '@react-three/fiber';
import {useProgress} from '@react-three/drei';
import {World} from './World';
import {Avatar} from './Avatar';
import {Suspense,useRef} from 'react';
import * as THREE from 'three';
import {type Player,type PublicRoom} from '@chicklets/shared';
import {Controls} from './Controls';

function ThirdPersonCamera({player}:{player:Player|undefined}){
 const focus=useRef(new THREE.Vector3(player?.position.x||0,1.6,player?.position.z||0));
 const destination=useRef(new THREE.Vector3());
 const look=useRef(new THREE.Vector3());
 useFrame(({camera},dt)=>{
  if(!player)return;
  destination.current.set(player.position.x,1.6,player.position.z);
  focus.current.lerp(destination.current,1-Math.exp(-8*Math.min(dt,.1)));
  destination.current.set(focus.current.x,focus.current.y+3.3,focus.current.z+9.2);
  camera.position.lerp(destination.current,1-Math.exp(-6*Math.min(dt,.1)));
  look.current.set(focus.current.x,focus.current.y+.5,focus.current.z-5);
  camera.lookAt(look.current);
 });
 return null;
}
export function Scene({room,id}:{room:PublicRoom;id:string}) {
 const player=room.players.find(p=>p.id===id);
 const {active}=useProgress();
 return <><div className="scene"><Canvas shadows="soft" dpr={[1,1.5]} camera={{position:[5,4.9,9.2],fov:62,near:.1,far:220}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}}>
   <Suspense fallback={null}><World/>{room.players.map(p=><Avatar key={p.id} player={p} local={p.id===id} speech={room.speech?.playerId===p.id?room.speech:null}/>)}</Suspense>
   <ThirdPersonCamera player={player}/>
 </Canvas>{active&&<div className="world-loading" role="status">Loading the mohalla…</div>}</div><Controls room={room} id={id}/></>;
}
