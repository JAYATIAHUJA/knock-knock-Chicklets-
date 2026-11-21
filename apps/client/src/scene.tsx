import {Canvas,useFrame} from '@react-three/fiber';
import {Html,useProgress} from '@react-three/drei';
import {World} from './World';
import {Avatar} from './Avatar';
import {Suspense,useRef} from 'react';
import * as THREE from 'three';
import {type Player,type PublicRoom} from '@chicklets/shared';
import {Controls} from './Controls';
import {getPixelDpr} from './pixel-render';

function ThirdPersonCamera({player}:{player:Player|undefined}){
 const focus=useRef(new THREE.Vector3(player?.position.x||0,1.6,player?.position.z||0));
 const destination=useRef(new THREE.Vector3());
 const look=useRef(new THREE.Vector3());
 useFrame(({camera,scene})=>{
  if(!player)return;
  const follow=scene.getObjectByName("local-avatar")?.position??player.position;
  destination.current.set(follow.x,1.6,follow.z);
  focus.current.copy(destination.current);
  destination.current.set(focus.current.x,focus.current.y+3.3,focus.current.z+9.2);
  camera.position.copy(destination.current);
  look.current.set(focus.current.x,focus.current.y+.5,focus.current.z-5);
  camera.lookAt(look.current);
 });
 return null;
}

function SafeZoneMarkers({room}:{room:PublicRoom}){
 if(room.phase!=='chase'||!room.safeZones?.length)return null;
 return <group>{room.safeZones.map(zone=><group key={zone.id} position={[zone.x,0,zone.z]}>
  <Html center position={[0,1.4,0]} distanceFactor={8} style={{pointerEvents:'none'}}><span className="oonch-sign">SAFE · {zone.name}</span></Html>
  <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}>
  <ringGeometry args={[zone.radius-.12,zone.radius,40]}/><meshBasicMaterial color="#36c98f" transparent opacity={.62}/>
 </mesh></group>)}</group>;
}

export function Scene({room,id}:{room:PublicRoom;id:string}) {
 const player=room.players.find(p=>p.id===id);
 const {active}=useProgress();


 return <>
  <div className={`scene ${room.phase==='chase'?'chase-active':''}`}>
   <Canvas className="pixel-canvas" shadows dpr={[1,1.5]} camera={{position:[5,4.9,9.2],fov:62,near:.1,far:220}} gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}}>
    <Suspense fallback={null}>
     <World/>

     <SafeZoneMarkers room={room}/>
     {room.players.map(p=><Avatar chasing={room.phase==='chase'} key={p.id} player={p} local={p.id===id} speech={room.speech?.playerId===p.id?room.speech:null}/>)}
    </Suspense>
    <ThirdPersonCamera player={player}/>
   </Canvas>
   {active&&<div className="world-loading" role="status">Loading the courtyard…</div>}
  </div>
  <Controls room={room} id={id}/>
 </>;
}
