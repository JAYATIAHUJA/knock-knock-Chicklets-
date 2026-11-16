import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html, RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import type {Player,Speech} from '@chicklets/shared';

const skin='#aa7354', trousers='#3c484d', shoe='#444039';
function Limb({length,radius,color}:{length:number;radius:number;color:string}) {
 return <mesh position={[0,-length/2,0]} castShadow><capsuleGeometry args={[radius,length-radius*2,6,12]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
}
export function Avatar({player,local,speech}:{player:Player;local:boolean;speech?:Speech|null}) {
 const initial=useRef<[number,number,number]>([player.position.x,0,player.position.z]);
 const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null);
 const hips=useRef<(THREE.Group|null)[]>([]),knees=useRef<(THREE.Group|null)[]>([]),shoulders=useRef<(THREE.Group|null)[]>([]),elbows=useRef<(THREE.Group|null)[]>([]);
 const previous=useRef(new THREE.Vector3(...initial.current)),phase=useRef(0),facing=useRef(Math.PI),blend=useRef(0);
 useFrame((_,delta)=>{
  if(!root.current)return;
  const dt=Math.min(delta,.05),position=root.current.position;
  position.x=THREE.MathUtils.damp(position.x,player.position.x,18,dt);
  position.z=THREE.MathUtils.damp(position.z,player.position.z,18,dt);
  const dx=position.x-previous.current.x,dz=position.z-previous.current.z;
  const speed=Math.hypot(dx,dz)/Math.max(dt,.001);
  blend.current=THREE.MathUtils.damp(blend.current,Math.min(speed/4.5,1),12,dt);
  if(speed>.12)facing.current=Math.atan2(dx,dz);
  const turn=Math.atan2(Math.sin(facing.current-root.current.rotation.y),Math.cos(facing.current-root.current.rotation.y));
  root.current.rotation.y+=turn*(1-Math.exp(-13*dt));
  phase.current+=dt*(speed>5?12:9);
  const run=THREE.MathUtils.clamp((speed-4)/3,0,1),amplitude=(.47+run*.27)*blend.current;
  for(let i=0;i<2;i++){
   const cycle=phase.current+i*Math.PI,swing=Math.sin(cycle);
   if(hips.current[i])hips.current[i]!.rotation.x=swing*amplitude;
   if(knees.current[i])knees.current[i]!.rotation.x=Math.max(0,-swing)*(.7+run*.65)*blend.current;
   if(shoulders.current[i])shoulders.current[i]!.rotation.x=-swing*amplitude*.8;
   if(elbows.current[i])elbows.current[i]!.rotation.x=-.15-run*.85;
  }
  if(body.current){body.current.position.y=Math.abs(Math.cos(phase.current))*.045*blend.current;body.current.rotation.x=run*.09;}
  previous.current.copy(position);
 });
 return <group ref={root} position={initial.current} rotation={[0,Math.PI,0]}>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.035,0]}><ringGeometry args={[.46,.49,48]}/><meshBasicMaterial color={player.role==='denner'?'#eaa05c':player.color} transparent opacity={local?.9:.4}/></mesh>
  <group ref={body}>
   <RoundedBox args={[.52,.66,.3]} radius={.1} smoothness={3} position={[0,1.29,0]} castShadow><meshStandardMaterial color={player.color} roughness={.95}/></RoundedBox>
   <mesh position={[0,1.6,0]}><cylinderGeometry args={[.085,.1,.17,12]}/><meshStandardMaterial color={skin}/></mesh>
   <RoundedBox args={[.44,.24,.29]} radius={.06} position={[0,.94,0]} castShadow><meshStandardMaterial color={trousers} roughness={1}/></RoundedBox>
   {[-1,1].map((side,i)=><group key={side}>
    <group ref={el=>{hips.current[i]=el}} position={[side*.145,.91,0]}>
     <Limb length={.43} radius={.112} color={trousers}/>
     <group ref={el=>{knees.current[i]=el}} position={[0,-.42,0]}>
      <Limb length={.37} radius={.084} color={trousers}/>
      <RoundedBox args={[.19,.14,.34]} radius={.05} position={[0,-.36,.065]} castShadow><meshStandardMaterial color={shoe} roughness={.8}/></RoundedBox>
      <RoundedBox args={[.195,.035,.34]} radius={.015} position={[0,-.42,.065]}><meshStandardMaterial color="#bbb7a8"/></RoundedBox>
     </group>
    </group>
    <group ref={el=>{shoulders.current[i]=el}} position={[side*.32,1.52,0]} rotation={[0,0,side*.08]}>
     <Limb length={.22} radius={.105} color={player.color}/>
     <Limb length={.3} radius={.075} color={skin}/>
     <group ref={el=>{elbows.current[i]=el}} position={[0,-.29,0]}>
      <Limb length={.28} radius={.062} color={skin}/>
      <mesh position={[0,-.29,0]} scale={[.065,.095,.045]} castShadow><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color={skin}/></mesh>
     </group>
    </group>
    <mesh position={[side*.205,1.83,0]} scale={[.055,.085,.045]} castShadow><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={skin}/></mesh>
   </group>)}
   <mesh position={[0,1.85,0]} scale={[.205,.265,.19]} castShadow><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color={skin} roughness={.9}/></mesh>
   <mesh position={[0,1.95,-.025]} scale={[.214,.19,.185]} castShadow><sphereGeometry args={[1,24,16,0,Math.PI*2,0,Math.PI*.7]}/><meshStandardMaterial color="#29251f" roughness={1}/></mesh>
   <mesh position={[0,1.83,.185]} scale={[.035,.05,.055]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={skin}/></mesh>
   {[-.08,.08].map(x=><group key={x}><mesh position={[x,1.89,.171]} scale={[.026,.016,.012]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#29251f"/></mesh><mesh position={[x,1.93,.17]} rotation={[0,0,x]}><boxGeometry args={[.061,.012,.012]}/><meshStandardMaterial color="#33291f"/></mesh></group>)}
   <mesh position={[0,1.75,.171]}><boxGeometry args={[.065,.012,.012]}/><meshStandardMaterial color="#734a37"/></mesh>
  </group>
  {speech&&<Html position={[0,3.2,0]} center distanceFactor={11}><div className="speech-bubble">{speech.text}</div></Html>}
  <Html position={[0,2.5,0]} center distanceFactor={11}><div className={`nametag ${player.role}`}>{local?'YOU · ':''}{player.name}{player.role!=='other'&&` · ${player.role.toUpperCase()}`}</div></Html>
 </group>;
}
