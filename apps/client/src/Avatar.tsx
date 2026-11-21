import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {localMotionInput} from './Controls';
import {ARENA,stepMotion,type Player,type Speech} from '@chicklets/shared';
import {getVoxelVariant} from './voxel-character';

function Block({size,position,color}:{size:[number,number,number];position:[number,number,number];color:string}){return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={1} flatShading/></mesh>}
function PixelHair({kind}:{kind:number}){const c='#211b18';if(kind===1)return <><Block size={[.44,.12,.38]} position={[0,2.08,0]} color={c}/><Block size={[.13,.2,.36]} position={[-.2,1.99,-.01]} color={c}/></>;if(kind===2)return <><Block size={[.4,.14,.36]} position={[0,2.08,0]} color={c}/>{[-.16,0,.16].map(x=><Block key={x} size={[.12,.12,.12]} position={[x,2.18,0]} color={c}/>)}</>;if(kind===3)return <><Block size={[.42,.11,.38]} position={[0,2.07,0]} color={c}/><Block size={[.16,.25,.18]} position={[.17,2.13,-.04]} color={c}/></>;return <><Block size={[.43,.13,.37]} position={[0,2.08,0]} color={c}/><Block size={[.44,.13,.12]} position={[0,2,.14]} color={c}/></>}

export function Avatar({player,local,speech,chasing}:{chasing:boolean;player:Player;local:boolean;speech?:Speech|null}){
 const variant=getVoxelVariant(player.id),root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),legs=useRef<(THREE.Group|null)[]>([]),arms=useRef<(THREE.Group|null)[]>([]);
 const spawn=useRef<[number,number,number]>([player.position.x,0,player.position.z]);
 const velocity=useRef({x:0,z:0});
 const previous=useRef(new THREE.Vector3(player.position.x,0,player.position.z)),phase=useRef(0),facing=useRef(Math.PI),blend=useRef(0);
 useFrame((_,delta)=>{if(!root.current)return;const dt=Math.min(delta,.05),position=root.current.position;if(local){
 const next=stepMotion(position,velocity.current,localMotionInput,dt,chasing&&player.role==='other');
 velocity.current=next.velocity;
 for(const axis of ['x','z'] as const){
  const authoritative=player.position[axis];
  const error=next.position[axis]-authoritative;
  position[axis]=Math.abs(error)>2?authoritative:THREE.MathUtils.clamp(authoritative+error*Math.exp(-14*dt),-ARENA,ARENA);
 }
 }else{position.x=THREE.MathUtils.damp(position.x,player.position.x,18,dt);position.z=THREE.MathUtils.damp(position.z,player.position.z,18,dt);}const dx=position.x-previous.current.x,dz=position.z-previous.current.z,speed=Math.hypot(dx,dz)/Math.max(dt,.001);blend.current=THREE.MathUtils.damp(blend.current,Math.min(speed/4.5,1),13,dt);if(speed>.12)facing.current=Math.atan2(dx,dz);const turn=Math.atan2(Math.sin(facing.current-root.current.rotation.y),Math.cos(facing.current-root.current.rotation.y));root.current.rotation.y+=turn*(1-Math.exp(-14*dt));phase.current+=dt*(speed>5?12:8.5);const pose=Math.round(Math.sin(phase.current)*4)/4,run=THREE.MathUtils.clamp((speed-4)/3,0,1),swing=pose*(.55+run*.25)*blend.current;legs.current.forEach((p,i)=>{if(p)p.rotation.x=i?-swing:swing});arms.current.forEach((p,i)=>{if(p)p.rotation.x=(i?swing:-swing)*.85});if(body.current)body.current.position.y=Math.round(Math.abs(Math.cos(phase.current))*2)/2*.055*blend.current;previous.current.copy(position)},-1);
 const shirt=player.color;
 return <group ref={root} name={local?"local-avatar":undefined} position={spawn.current} rotation={[0,Math.PI,0]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.43,.53,16]}/><meshBasicMaterial color={player.role==='denner'?'#ff9e45':player.role==='runner'?'#f6d34f':shirt} transparent opacity={local?.95:.55}/></mesh>
  {chasing&&player.role!=='other'&&<mesh position={[0,.055,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={player.role==='denner'?[1.07,1.2,32]:[.7,.9,32]}/><meshBasicMaterial color={player.role==='denner'?'#ef5939':'#ffd45c'} transparent opacity={.8}/></mesh>}
  <group ref={body}><Block size={[.54,.63,.32]} position={[0,1.3,0]} color={shirt}/>{variant.outfit===1&&<Block size={[.54,.11,.335]} position={[0,1.35,.01]} color={variant.accent}/>} {variant.outfit===2&&<><Block size={[.09,.63,.335]} position={[0,1.3,.01]} color={variant.accent}/><Block size={[.54,.08,.34]} position={[0,1.49,.01]} color={variant.accent}/></>}<Block size={[.46,.22,.32]} position={[0,.88,0]} color={variant.trouser}/>
   {[-1,1].map((side,i)=><group key={`leg-${side}`} ref={el=>{legs.current[i]=el}} position={[side*.14,.82,0]}><Block size={[.2,.46,.22]} position={[0,-.22,0]} color={variant.trouser}/><Block size={[.21,.16,.36]} position={[0,-.52,.08]} color="#332e2a"/></group>)}
   {[-1,1].map((side,i)=><group key={`arm-${side}`} ref={el=>{arms.current[i]=el}} position={[side*.36,1.52,0]}><Block size={[.18,.3,.22]} position={[0,-.15,0]} color={shirt}/><Block size={[.15,.34,.18]} position={[0,-.46,0]} color={variant.skin}/><Block size={[.18,.16,.2]} position={[0,-.66,0]} color={variant.skin}/></group>)}
   <Block size={[.42,.42,.38]} position={[0,1.88,0]} color={variant.skin}/><PixelHair kind={variant.hair}/>{[-.09,.09].map(x=><Block key={x} size={[.045,.045,.025]} position={[x,1.91,.202]} color="#181515"/>)}<Block size={[.1,.035,.025]} position={[0,1.79,.205]} color="#713c35"/>
  </group>
  {speech&&<Html position={[0,3.2,0]} center distanceFactor={11}><div className="speech-bubble pixel-bubble">{speech.text}</div></Html>}<Html position={[0,2.55,0]} center distanceFactor={11}><div className={`nametag pixel-nametag ${player.role}`}>{local?'YOU · ':''}{player.name}{player.role!=='other'&&` · ${player.role.toUpperCase()}`}</div></Html>
 </group>
}
