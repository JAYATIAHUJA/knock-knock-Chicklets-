import {Text} from '@react-three/drei';
import * as THREE from 'three';
import {useMemo,useEffect} from 'react';

function HindiBoard({at,title,subtitle,color,width=6}:{at:[number,number,number];title:string;subtitle:string;color:string;width?:number}){
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=320;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle=color;ctx.fillRect(0,0,1536,320);
  ctx.strokeStyle='#f5d99d';ctx.lineWidth=10;ctx.strokeRect(18,18,1500,284);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff1cf';
  ctx.font='bold 142px "Nirmala UI", sans-serif';ctx.fillText(title,768,125,1420);
  ctx.font='44px "Nirmala UI", sans-serif';ctx.fillText(subtitle,768,252,1400);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;return map;
 },[title,subtitle,color]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={at}><Rod at={[0,0,-.1]} size={[width+.1,1.36,.18]} color="#514637"/><mesh receiveShadow><planeGeometry args={[width,1.25]}/><meshStandardMaterial map={texture} roughness={.88}/></mesh></group>;
}

function ShopGoods(){
 return <>
  <HindiBoard at={[-18,4,-21.93]} title="भारत इलेक्ट्रॉनिक्स" subtitle="टी.वी. • रेडियो • पंखे की मरम्मत" color="#ad302e"/>
  <HindiBoard at={[-9,4,-21.93]} title="शर्मा जनरल स्टोर" subtitle="टॉफी • बिस्कुट • ठंडा • रिचार्ज" color="#157a80"/>
  <HindiBoard at={[9,4,-21.93]} title="ताज़े फल और सब्ज़ी" subtitle="आज का ताज़ा माल • सही दाम" color="#8b4427"/>
  <HindiBoard at={[0,4,-21.93]} title="अपना मोहल्ला" subtitle="शाम हुई? खेलने आ जाओ!" color="#375e49"/>
  <HindiBoard at={[18,4,-21.93]} title="राजू चाय भंडार" subtitle="गरम चाय • समोसा • नमकीन" color="#a94831"/>
  {/* Stocked wooden shelves break up the dark, empty shop openings. */}
  {[-9,0].map((x,shop)=><group key={x} position={[x,0,-22.1]}>
   {[1.1,1.8,2.5].map((y,row)=><group key={y}>
    <Rod at={[0,y,0]} size={[5.1,.09,.55]} color="#92734c"/>
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-2.3+i*.42,y+.22,0]} castShadow><boxGeometry args={[.28,.35+(i%3)*.045,.23]}/><meshStandardMaterial color={['#d4b461','#a44737','#719178','#ded2aa','#6b8587'][(i+row+shop)%5]} roughness={.9}/></mesh>)}
   </group>)}
  </group>)}
  <group position={[18,0,-21.3]}>
   <Rod at={[0,.75,0]} size={[4.8,1.4,.8]} color="#487c75"/>
   <Rod at={[0,1.5,0]} size={[5,.12,1]} color="#887a62"/>
   <mesh position={[-1.3,1.84,0]} castShadow><cylinderGeometry args={[.3,.35,.55,20]}/><meshStandardMaterial color="#b0b3a5" metalness={.75} roughness={.3}/></mesh>
   <mesh position={[-1.3,2.14,0]} castShadow><sphereGeometry args={[.3,16,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#929b92" metalness={.7} roughness={.4}/></mesh>
   {Array.from({length:6},(_,i)=><mesh key={i} position={[-.35+i*.35,1.66,.25]} castShadow><cylinderGeometry args={[.09,.065,.22,10]}/><meshStandardMaterial color="#b5754b" roughness={1}/></mesh>)}
   <group position={[0,0,1.05]}><Rod at={[0,.5,0]} size={[3.4,.12,.45]} color="#796044"/>{[-1.4,1.4].map(x=><Rod key={x} at={[x,.25,0]} size={[.12,.5,.35]} color="#4c5144"/>)}</group>
  </group>
  {/* Hanging foil packet strips project out from the shop recess. */}
  {[-11.8,-10.9,-7.1].map((x,col)=><group key={x} position={[x,3,-21.1]}>
   <Rod at={[0,-.8,0]} size={[.025,1.9,.025]} color="#837352"/>
   {Array.from({length:6},(_,i)=><group key={i} position={[0,-i*.31,.02]} rotation={[0,(col-1)*.22,(i%2-.5)*.12]}>
    <mesh castShadow><boxGeometry args={[.29,.27,.09]}/><meshStandardMaterial color={['#d2b124','#c43629','#297e54'][(i+col)%3]} metalness={.25} roughness={.38}/></mesh>
    <Rod at={[0,0,.052]} size={[.20,.07,.008]} color="#fff0bb"/>
   </group>)}
  </group>)}
  {/* Curved banana bunches, hanging from the fruit awning. */}
  {[6.2,11.7].map(x=><group key={x} position={[x,2.9,-21]}>
   <Rod at={[0,.2,0]} size={[.035,.5,.035]} color="#736440"/>
   {Array.from({length:9},(_,i)=><mesh key={i} position={[(i%3-1)*.14,-Math.floor(i/3)*.18,Math.floor(i/3)*.09]} rotation={[.2,0,-.8+(i%3)*.25]} castShadow><torusGeometry args={[.22,.055,7,12,2.1]}/><meshStandardMaterial color={i%2?'#d4b52c':'#e4ca46'} roughness={.8}/></mesh>)}
  </group>)}
  {/* CRT televisions with deep cases, glass screens and tuning knobs. */}
  {[-20,-18.5,-17].map((x,i)=><group key={x} position={[x,1.35,-21.5]} rotation={[0,(i-1)*.12,0]}>
   <Rod at={[0,0,0]} size={[1.15,.85,.7]} color={i%2?'#514334':'#333b39'}/>
   <mesh position={[-.08,0,.36]}><boxGeometry args={[.81,.6,.04]}/><meshStandardMaterial color="#647f7b" roughness={.18} metalness={.3}/></mesh>
   <Rod at={[.46,.16,.38]} size={[.09,.09,.04]} color="#aaa38b"/>
  </group>)}
 </>;
}

function Rod({at,size,color='#73543b'}:{at:[number,number,number];size:[number,number,number];color?:string}){return <mesh position={at} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.9}/></mesh>}
export function StreetLife(){
 return <>
  <ShopGoods/>
  {/* A woven charpai on the verandah, beyond the playable chalk boundary. */}
  <group position={[-14,.1,-21.4]} rotation={[0,.1,0]}>
   {[-1.3,1.3].map(x=><group key={x}>{[-.5,.5].map(z=><Rod key={z} at={[x,.35,z]} size={[.12,.7,.12]}/>)}<Rod at={[x,.67,0]} size={[.12,.12,1.15]}/></group>)}
   {[-.5,.5].map(z=><Rod key={z} at={[0,.67,z]} size={[2.7,.12,.12]}/>)}
   {Array.from({length:27},(_,i)=><Rod key={i} at={[-1.25+i*.095,.68,0]} size={[.035,.025,1]} color="#c3b28c"/>)}
   {Array.from({length:12},(_,i)=><Rod key={i} at={[0,.7,-.48+i*.085]} size={[2.5,.02,.025]} color="#9a7c51"/>)}
  </group>
  {/* Stapu chalk drawing: flat marks never obstruct a chase. */}
  <group position={[-9,.045,5]} rotation={[-Math.PI/2,0,-.2]}>
   {Array.from({length:7},(_,i)=>{const x=i===2?-.5:i===3?.5:i===5?-.5:i===6?.5:0;const y=i<3?i:i<5?i-1:4;return <group key={i} position={[x,y,0]}><lineLoop><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([-.47,-.47,0,.47,-.47,0,.47,.47,0,-.47,.47,0]),3]}/></bufferGeometry><lineBasicMaterial color="#ede0c1" transparent opacity={.7}/></lineLoop><Text fontSize={.32} color="#e2d7b9">{i+1}</Text></group>})}
  </group>
  {/* Everyday rooftop washing instead of ornamental historical scenery. */}
  <group position={[-10,7.3,-21.1]}>
   <Rod at={[0,0,0]} size={[6,.025,.025]} color="#454b39"/>
   {['#a65345','#c5b99d','#547984','#caa861','#868653'].map((color,i)=><group key={i} position={[-2.4+i*1.15,-.65,0]} rotation={[.08,0,(i%2-.5)*.08]}><mesh castShadow><planeGeometry args={[.8,1.3,2,3]}/><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={1}/></mesh><Rod at={[-.28,.66,0]} size={[.04,.12,.06]}/><Rod at={[.28,.66,0]} size={[.04,.12,.06]}/></group>)}
  </group>
  <group position={[12,.1,-21.6]} rotation={[0,-.1,0]}>
   <Rod at={[0,1.5,0]} size={[.7,2.8,.12]} color="#d9ba55"/>
   <Text position={[0,2.1,.08]} fontSize={.25} color="#6d3028">STD</Text><Text position={[0,1.65,.08]} fontSize={.25} color="#6d3028">PCO</Text><Text position={[0,1.1,.08]} fontSize={.12} color="#553b2c">LOCAL</Text><Text position={[0,.85,.08]} fontSize={.12} color="#553b2c">CALL ₹1</Text>
  </group>
  <group position={[20.8,0,3]}>
   <mesh position={[0,.15,0]} receiveShadow><cylinderGeometry args={[.85,.9,.3,24]}/><meshStandardMaterial color="#9f9c88"/></mesh>
   <mesh position={[0,.9,0]} castShadow><cylinderGeometry args={[.12,.18,1.5,12]}/><meshStandardMaterial color="#54796b" metalness={.4} roughness={.7}/></mesh>
   <Rod at={[.2,1.35,0]} size={[.55,.12,.13]} color="#54796b"/><Rod at={[.45,1.23,0]} size={[.1,.3,.1]} color="#54796b"/>
   <group position={[0,1.6,0]} rotation={[0,0,-.5]}><Rod at={[-.45,0,0]} size={[1.1,.06,.07]} color="#414f43"/></group>
   <mesh position={[.48,.4,0]} castShadow><cylinderGeometry args={[.26,.2,.5,16,1,true]}/><meshStandardMaterial color="#8c9692" metalness={.7} roughness={.4} side={THREE.DoubleSide}/></mesh>
  </group>
 </>;
}
