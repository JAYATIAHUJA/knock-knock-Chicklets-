import {Canvas,useFrame} from '@react-three/fiber';
import {Html,useProgress} from '@react-three/drei';
import {World} from './World';
import {Avatar} from './Avatar';
import {Suspense,useRef} from 'react';
import * as THREE from 'three';
import {type Player,type PublicRoom,CATCH_RADIUS} from '@chicklets/shared';
import {Controls} from './Controls';
import {getPixelDpr} from './pixel-render';

function ThirdPersonCamera({player,shake}:{player:Player|undefined;shake:boolean}){
 const focus=useRef(new THREE.Vector3(player?.position.x||0,1.6,player?.position.z||0));
 const destination=useRef(new THREE.Vector3());
 const look=useRef(new THREE.Vector3());
 useFrame(({camera},dt)=>{
  if(!player)return;
  destination.current.set(player.position.x,1.6,player.position.z);
  focus.current.copy(destination.current);
  destination.current.set(focus.current.x,focus.current.y+3.3,focus.current.z+9.2);
  if(shake){
   destination.current.x+=(Math.random()-.5)*0.35;
   destination.current.y+=(Math.random()-.5)*0.35;
  }
  camera.position.lerp(destination.current,1-Math.exp(-6*Math.min(dt,.1)));
  look.current.set(focus.current.x,focus.current.y+.5,focus.current.z-5);
  camera.lookAt(look.current);
 });
 return null;
}

// Visual rings during chase showing danger proximity
function ChaseRings({room,localId}:{room:PublicRoom;localId:string}){
 if(room.phase!=='chase'||!room.dennerId||!room.runnerId)return null;
 const denner=room.players.find(p=>p.id===room.dennerId);
 const runner=room.players.find(p=>p.id===room.runnerId);
 if(!denner||!runner)return null;

 const dist=Math.hypot(denner.position.x-runner.position.x,denner.position.z-runner.position.z);
 const isDanger=dist<4.5;

 return <group>
  {/* Catch zone ring around denner */}
  <mesh position={[denner.position.x,0.06,denner.position.z]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[CATCH_RADIUS-0.08,CATCH_RADIUS+0.05,32]}/>
   <meshBasicMaterial color="#d44026" transparent opacity={0.7}/>
  </mesh>
  {/* Target aura under runner */}
  <mesh position={[runner.position.x,0.05,runner.position.z]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[0.7,0.9,32]}/>
   <meshBasicMaterial color={isDanger?'#ff2200':'#e8b23c'} transparent opacity={isDanger?0.85:0.4}/>
  </mesh>
 </group>;
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
 const isCaught=room.phase==='caught';

 return <>
  <div className={`scene ${room.phase==='chase'?'chase-active':''}`}>
   <Canvas className="pixel-canvas" shadows dpr={getPixelDpr(window.devicePixelRatio)} camera={{position:[5,4.9,9.2],fov:62,near:.1,far:220}} gl={{antialias:false,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1}}>
    <Suspense fallback={null}>
     <World/>
     <ChaseRings room={room} localId={id}/>
     <SafeZoneMarkers room={room}/>
     {room.players.map(p=><Avatar key={p.id} player={p} local={p.id===id} speech={room.speech?.playerId===p.id?room.speech:null}/>)}
    </Suspense>
    <ThirdPersonCamera player={player} shake={isCaught}/>
   </Canvas>
   {active&&<div className="world-loading" role="status">Loading the courtyard…</div>}
  </div>
  <Controls room={room} id={id}/>
 </>;
}
