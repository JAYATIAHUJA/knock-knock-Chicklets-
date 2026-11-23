import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html,useTexture} from '@react-three/drei';
import * as THREE from 'three';
import {localMotionInput} from './Controls';
import {ARENA,stepMotion,type Player,type Speech} from '@chicklets/shared';
import {getSpriteCharacter,getSpriteDirection,getSpriteFrame,getSpritePose,getStraightRunFrame,type SpriteDirection,type SpritePose} from './sprite-character';
import {serverNow} from './serverClock';

export function Avatar({player,local,speech,chasing}:{chasing:boolean;player:Player;local:boolean;speech?:Speech|null}){
 const character=getSpriteCharacter(player);
 const atlas=useTexture(`/characters/${character}.${character==='tara'||character==='kabir'?'png':'webp'}`);
 const straightAtlas=useTexture(`/characters/${character}-straight-run.png`);
 const frameTexture=useMemo(()=>{
  const texture=atlas.clone();
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.NearestFilter;
  texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.repeat.set(1/12,.25);
  texture.offset.set(0,.75);
  texture.needsUpdate=true;
  return texture;
 },[atlas]);
 useEffect(()=>()=>frameTexture.dispose(),[frameTexture]);
 const straightTexture=useMemo(()=>{
  const texture=straightAtlas.clone();texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;texture.repeat.set(.25,.5);texture.offset.set(0,.5);texture.needsUpdate=true;
  return texture;
 },[straightAtlas]);
 useEffect(()=>()=>straightTexture.dispose(),[straightTexture]);
 const oldSprite=useRef<THREE.Sprite>(null),straightSprite=useRef<THREE.Sprite>(null);

 const root=useRef<THREE.Group>(null);
 const spawn=useRef<[number,number,number]>([player.position.x,0,player.position.z]);
 const velocity=useRef({x:0,z:0});
 const snapshot=useRef(player);
 const pending=useRef<{seq:number;dx:number;dz:number;sprint:boolean;dt:number}[]>([]);
 const predicted=useRef({...player.position});
 const previous=useRef(new THREE.Vector3(player.position.x,0,player.position.z));
 const pose=useRef<SpritePose>('idle');
 const direction=useRef<SpriteDirection>('front');
 const poseElapsed=useRef(0);
 const visibleFrame=useRef(-1);
 const remoteSnapshotAt=useRef(performance.now());

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
   const input={...localMotionInput,seq:++localMotionInput.seq,dt};
   pending.current.push(input);
   if(pending.current.length>120)pending.current.shift();
   const next=stepMotion(predicted.current,velocity.current,input,dt,chasing&&player.role==='other');
   predicted.current={x:THREE.MathUtils.clamp(next.position.x,-ARENA,ARENA),z:THREE.MathUtils.clamp(next.position.z,-ARENA,ARENA)};
   velocity.current=next.velocity;
   position.x=THREE.MathUtils.damp(position.x,predicted.current.x,50,dt);
   position.z=THREE.MathUtils.damp(position.z,predicted.current.z,50,dt);
  }else{
   if(snapshot.current!==player){snapshot.current=player;remoteSnapshotAt.current=performance.now()}
   const ahead=Math.min((performance.now()-remoteSnapshotAt.current)/1000,.075);
   const targetX=player.position.x+(player.velocity?.x??0)*ahead;
   const targetZ=player.position.z+(player.velocity?.z??0)*ahead;
   if(Math.hypot(position.x-targetX,position.z-targetZ)>3){position.x=targetX;position.z=targetZ}
   else{position.x=THREE.MathUtils.damp(position.x,targetX,24,dt);position.z=THREE.MathUtils.damp(position.z,targetZ,24,dt)}
  }
  const motion=local?velocity.current:(player.velocity??{x:(position.x-previous.current.x)/Math.max(dt,.001),z:(position.z-previous.current.z)/Math.max(dt,.001)});
  const usingInput=local&&(localMotionInput.dx!==0||localMotionInput.dz!==0);
  const dx=usingInput?localMotionInput.dx:motion.x;
  const dz=usingInput?localMotionInput.dz:motion.z;
  direction.current=getSpriteDirection(dx,dz,direction.current);
  const speed=Math.hypot(motion.x,motion.z);
  const nextPose=getSpritePose(speed,serverNow()<(player.freezeUntil??0));
  if(nextPose!==pose.current){pose.current=nextPose;poseElapsed.current=0}else poseElapsed.current+=dt;
  const frame=getSpriteFrame(pose.current,poseElapsed.current,direction.current);
  const straight=getStraightRunFrame(pose.current,poseElapsed.current,direction.current);
  if(oldSprite.current)oldSprite.current.visible=!straight;
  if(straightSprite.current)straightSprite.current.visible=Boolean(straight);
  if(straight){straightTexture.offset.set(straight.column/4,(1-straight.row)*.5)}
  const frameIndex=frame.row*12+frame.column+(frame.flipX?48:0);
  if(frameIndex!==visibleFrame.current){
   frameTexture.repeat.x=frame.flipX?-1/12:1/12;
   frameTexture.offset.set((frame.column+(frame.flipX?1:0))/12,(3-frame.row)*.25);
   visibleFrame.current=frameIndex;
  }
  previous.current.copy(position);
 },-1);

 return <group ref={root} name={local?'local-avatar':undefined} position={spawn.current}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.43,.53,16]}/><meshBasicMaterial color={player.role==='denner'?'#ff9e45':player.role==='runner'?'#f6d34f':player.color} transparent opacity={local?.95:.55}/></mesh>
  {chasing&&player.role!=='other'&&<mesh position={[0,.055,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={player.role==='denner'?[1.07,1.2,32]:[.7,.9,32]}/><meshBasicMaterial color={player.role==='denner'?'#ef5939':'#ffd45c'} transparent opacity={.8}/></mesh>}
  <sprite ref={oldSprite} position={[0,1.22,0]} scale={[2.42,2.42,1]}><spriteMaterial map={frameTexture} transparent alphaTest={.08} depthWrite={false} toneMapped={false}/></sprite><sprite ref={straightSprite} visible={false} position={[0,1.22,0]} scale={[2.42,2.42,1]}><spriteMaterial map={straightTexture} transparent alphaTest={.08} depthWrite={false} toneMapped={false}/></sprite>
  {speech&&<Html position={[0,3.2,0]} center distanceFactor={11}><div className="speech-bubble pixel-bubble">{speech.text}</div></Html>}
  <Html position={[0,2.55,0]} center distanceFactor={11}><div className={`nametag pixel-nametag ${player.role}`}>{local?'YOU · ':''}{player.name}{player.role!=='other'&&` · ${player.role.toUpperCase()}`}</div></Html>
 </group>;
}
