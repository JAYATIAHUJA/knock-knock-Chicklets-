import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html,useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {localMotionInput} from './Controls';
import {ARENA,stepMotion,type Player,type Speech} from '@chicklets/shared';
import {getSpriteCharacter,getSpriteFrame,getSpritePose,type SpritePose} from './sprite-character';
import {serverNow} from './serverClock';

export function Avatar({player,local,speech,chasing}:{chasing:boolean;player:Player;local:boolean;speech?:Speech|null}){
 const character=getSpriteCharacter(player);
 const atlas=useTexture(`/characters/${character}.webp`);
 const frameTexture=useMemo(()=>{
  const texture=atlas.clone();
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.repeat.set(.25,.25);
  texture.offset.set(0,.75);
  texture.needsUpdate=true;
  return texture;
 },[atlas]);
 useEffect(()=>()=>frameTexture.dispose(),[frameTexture]);

 const root=useRef<THREE.Group>(null);
 const spawn=useRef<[number,number,number]>([player.position.x,0,player.position.z]);
 const velocity=useRef({x:0,z:0});
 const snapshot=useRef(player);
 const pending=useRef<{seq:number;dx:number;dz:number;sprint:boolean;dt:number}[]>([]);
 const predicted=useRef({...player.position});
 const previous=useRef(new THREE.Vector3(player.position.x,0,player.position.z));
 const pose=useRef<SpritePose>('idle');
 const poseElapsed=useRef(0);
 const visibleFrame=useRef(-1);

 useFrame((_,delta)=>{
  if(!root.current)return;
  const dt=Math.min(delta,.05),position=root.current.position;
  if(local){
   if(snapshot.current!==player){
    snapshot.current=player;
    pending.current=pending.current.filter(input=>input.seq>(player.lastSeq??0));
    predicted.current={...player.position};
    velocity.current=player.velocity??{x:0,z:0};
    for(const input of pending.current){
     const replay=stepMotion(predicted.current,velocity.current,input,input.dt,chasing&&player.role==='other');
     predicted.current=replay.position;
     velocity.current=replay.velocity;
    }
   }
   const input={...localMotionInput,dt};
   pending.current.push(input);
   if(pending.current.length>120)pending.current.shift();
   const next=stepMotion(predicted.current,velocity.current,input,dt,chasing&&player.role==='other');
   predicted.current={x:THREE.MathUtils.clamp(next.position.x,-ARENA,ARENA),z:THREE.MathUtils.clamp(next.position.z,-ARENA,ARENA)};
   velocity.current=next.velocity;
   position.x=THREE.MathUtils.damp(position.x,predicted.current.x,35,dt);
   position.z=THREE.MathUtils.damp(position.z,predicted.current.z,35,dt);
  }else{
   position.x=THREE.MathUtils.damp(position.x,player.position.x,18,dt);
   position.z=THREE.MathUtils.damp(position.z,player.position.z,18,dt);
  }
  const speed=position.distanceTo(previous.current)/Math.max(dt,.001);
  const nextPose=getSpritePose(speed,serverNow()<(player.freezeUntil??0));
  if(nextPose!==pose.current){pose.current=nextPose;poseElapsed.current=0}else poseElapsed.current+=dt;
  const frame=getSpriteFrame(pose.current,poseElapsed.current);
  const frameIndex=frame.row*4+frame.column;
  if(frameIndex!==visibleFrame.current){
   frameTexture.offset.set(frame.column*.25,(3-frame.row)*.25);
   visibleFrame.current=frameIndex;
  }
  previous.current.copy(position);
 },-1);

 return <group ref={root} name={local?'local-avatar':undefined} position={spawn.current}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.43,.53,16]}/><meshBasicMaterial color={player.role==='denner'?'#ff9e45':player.role==='runner'?'#f6d34f':player.color} transparent opacity={local?.95:.55}/></mesh>
  {chasing&&player.role!=='other'&&<mesh position={[0,.055,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={player.role==='denner'?[1.07,1.2,32]:[.7,.9,32]}/><meshBasicMaterial color={player.role==='denner'?'#ef5939':'#ffd45c'} transparent opacity={.8}/></mesh>}
  <sprite position={[0,1.22,0]} scale={[2.42,2.42,1]}><spriteMaterial map={frameTexture} transparent alphaTest={.08} depthWrite={false} toneMapped={false}/></sprite>
  {speech&&<Html position={[0,3.2,0]} center distanceFactor={11}><div className="speech-bubble pixel-bubble">{speech.text}</div></Html>}
  <Html position={[0,2.55,0]} center distanceFactor={11}><div className={`nametag pixel-nametag ${player.role}`}>{local?'YOU · ':''}{player.name}{player.role!=='other'&&` · ${player.role.toUpperCase()}`}</div></Html>
 </group>;
}
