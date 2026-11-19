import { memo, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Cloud, Clouds, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {StreetLife} from './StreetLife';
import {getTextureFilterMode} from './pixel-render';

type V3 = [number, number, number];
const base = '/textures/';
const surfaceCache = new Map<string, THREE.Texture[]>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function useSurface(name: string, repeat: number) {
  const originals = useTexture(['Diffuse', 'nor_gl', 'Rough'].map(map => `${base}${name}_${map}.jpg`));
  return useMemo(() => {
   const key = `${name}:${repeat}`;
   if (surfaceCache.has(key)) return surfaceCache.get(key)!;
   const textures = originals.map((source, i) => {
    const texture = source.clone();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    const pixel=getTextureFilterMode(i)==='pixel';
    texture.magFilter = pixel?THREE.NearestFilter:THREE.LinearFilter;
    texture.minFilter = pixel?THREE.NearestFilter:THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = !pixel;
    texture.anisotropy = 1;
    texture.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
   });
   surfaceCache.set(key, textures);
   return textures;
  }, [originals, repeat, name]);
}
function Block({ at, size, color = '#d5c4aa', surface = 'plaster' }: {at: V3; size: V3; color?: string; surface?: 'plaster' | 'wood' | 'metal'}) {
  const [map, normalMap, roughnessMap] = useSurface(surface === 'wood' ? 'brown_planks_03' : 'plastered_wall_02', 1);
  const material = useMemo(() => {
    const key = `${surface}:${color}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({color, map:surface==='metal'?null:map, normalMap:surface==='metal'?null:normalMap, normalScale:new THREE.Vector2(.45,.45),roughnessMap,roughness:.85,metalness:surface==='metal'?.5:0}));
    return materialCache.get(key)!;
  }, [color,surface,map,normalMap,roughnessMap]);
  return <mesh position={at} material={material} userData={{batch:true}} castShadow receiveShadow><boxGeometry args={size}/></mesh>;
}
// Architecture is static: combine pieces by material instead of drawing each railing separately.
function StaticArchitecture({children}:{children:ReactNode}) {
  const root=useRef<THREE.Group>(null);
  useLayoutEffect(()=>{
    if(!root.current)return;
    const group=root.current;group.updateWorldMatrix(true,true);
    const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
    const originals:THREE.Mesh[]=[];const merged:THREE.Mesh[]=[];
    group.traverse(object=>{
      if(!(object instanceof THREE.Mesh)||!object.userData.batch)return;
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
      const material=object.material as THREE.Material;
      if(!batches.has(material))batches.set(material,[]);
      batches.get(material)!.push(geometry);originals.push(object);object.visible=false;
    });
    for(const [material,geometries] of batches){
      const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
      if(!geometry)continue;
      const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);merged.push(mesh);
    }
    return ()=>{merged.forEach(mesh=>{group.remove(mesh);mesh.geometry.dispose()});originals.forEach(mesh=>{mesh.visible=true})};
  },[]);
  return <group ref={root}>{children}</group>;
}
function Window({x,y}: {x:number;y:number}) {
  return <group position={[x,y,2.56]}>
    <Block at={[0,0,0]} size={[1.65,2.35,.15]} color="#bcb29d"/>
    <Block at={[0,0,.09]} size={[1.32,2.08,.1]} color="#192d2a" surface="metal"/>
    {[-1,1].map(side=><group key={side} position={[side*.85,0,.15]} rotation={[0,side*.24,0]}>
      <Block at={[0,0,0]} size={[.35,2.1,.09]} color="#67857a" surface="wood"/>
      {Array.from({length:9},(_,i)=><Block key={i} at={[0,-.85+i*.21,.06]} size={[.34,.055,.045]} color="#425c50" surface="wood"/>)}
    </group>)}
    {[-.45,0,.45].map(v=><Block key={v} at={[v,0,.22]} size={[.025,2.05,.025]} color="#333a36" surface="metal"/>)}
    <Block at={[0,-1.25,.12]} size={[1.98,.15,.55]} color="#c9b99c"/>
  </group>;
}
function Building({x,z,rotation=0,color,label,index=0}: {x:number;z:number;rotation?:number;color:string;label:string;index?:number}) {
  const height = [9.6,8.2,8.9,10.2,8.5][index%5];
  return <group position={[x,0,z]} rotation={[0,rotation,0]}>
    <Block at={[0,height/2,0]} size={[8,height,5]} color={color}/>
    <Block at={[0,.35,2.8]} size={[8.4,.7,1.1]} color="#9d9787"/>
    <Block at={[0,3.6,2.6]} size={[8.3,.22,.8]} color="#b3a68c"/>
    <Block at={[0,height+.12,0]} size={[8.5,.24,5.5]} color="#afa48c"/>
    <Block at={[0,height+.65,-2.35]} size={[8,.95,.25]} color={color}/>
    {[-3.85,3.85].map(v=><Block key={v} at={[v,height+.65,0]} size={[.25,.95,5]} color={color}/>)}
    <Block at={[0,1.95,2.53]} size={[6.7,2.7,.12]} color={['#60554a','#45574d','#71604d','#5d643d','#5c4940'][index%5]} surface="wood"/>
    {[-2.9,2.9].map(v=><Block key={v} at={[v,1.95,2.67]} size={[.75,2.7,.12]} color="#687a6a" surface="wood"/>)}
    <Block at={[0,3.95,2.72]} size={[7.3,.85,.18]} color="#e5d3ad"/>
    <Text position={[0,3.96,2.83]} fontSize={.38} color="#3a4c42" maxWidth={6.5}>{label}</Text>
    <group position={[0,3.25,3.1]} rotation={[.14,0,0]}>
      {Array.from({length:16},(_,i)=><Block key={i} at={[-3.75+i*.5,0,0]} size={[.5,.045,1.7]} color={i%2 ? '#c4b58e' : index%2 ? '#54796f' : '#975a47'}/>)}
    </group>
    {[-3.65,3.65].map(v=><Block key={v} at={[v,1.65,3.8]} size={[.055,3.3,.055]} color="#4e5144" surface="metal"/>)}
    <Window x={-2.15} y={6.05}/><Window x={2.15} y={6.05}/>
    <Block at={[0,4.7,3]} size={[7.7,.2,1.3]} color="#b7b19e"/>
    <Block at={[0,5.65,3.6]} size={[7.6,.055,.055]} color="#41483d" surface="metal"/>
    <Block at={[0,5.05,3.6]} size={[7.6,.045,.045]} color="#41483d" surface="metal"/>
    {Array.from({length:24},(_,i)=><Block key={i} at={[-3.6+i*.31,5.2,3.6]} size={[.025,1,.025]} color="#41483d" surface="metal"/>)}
    <mesh position={[2,height+.8,-.6]} castShadow><cylinderGeometry args={[.8,.8,1.5,24]}/><meshStandardMaterial color="#343a33" roughness={.8}/></mesh>
    {[0,.3,.6,.9,1.2].map(v=><mesh key={v} position={[2,height+.16+v,-.6]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.81,.025,4,24]}/><meshStandardMaterial color="#50574b"/></mesh>)}
    <Block at={[-3.5,4,2.68]} size={[.07,7.7,.07]} color="#6e6756" surface="metal"/>
    <Block at={[2.4,7.6,2.85]} size={[1,.62,.5]} color="#c2bca7" surface="metal"/>
    {Array.from({length:7},(_,i)=><Block key={i} at={[2.4,7.4+i*.06,3.12]} size={[.85,.018,.02]} color="#646f66" surface="metal"/>)}
    {(index%5===3?[-2,-.5,1,2.5]:[]).map((v,i)=><group key={v} position={[v,.8,3]}>
      <Block at={[0,0,0]} size={[1.1,.65,.8]} color="#a68b5f" surface="wood"/>
      {Array.from({length:8},(_,j)=><mesh key={j} position={[(j%4-.5)*.22-.22,.4,Math.floor(j/4)*.25-.1]} castShadow><sphereGeometry args={[.13,8,8]}/><meshStandardMaterial color={i%2?'#b5a446':'#b56c38'} roughness={.8}/></mesh>)}
    </group>)}
  </group>;
}
function Tree({at,seed=1}: {at:V3;seed?:number}) {
  const leaves=useRef<THREE.InstancedMesh>(null);
  const leafShape=useMemo(()=>{const shape=new THREE.Shape();shape.moveTo(0,-1);shape.quadraticCurveTo(-.7,0,0,1);shape.quadraticCurveTo(.7,0,0,-1);return shape;},[]);
  useLayoutEffect(()=>{
    if(!leaves.current)return;
    let state=seed*7919;
    const rand=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296};
    const dummy=new THREE.Object3D();const color=new THREE.Color();
    for(let i=0;i<2600;i++) {
      const a=rand()*Math.PI*2,r=Math.sqrt(rand())*3.4;
      dummy.position.set(Math.cos(a)*r,5.6+rand()*2.9-r*.26,Math.sin(a)*r);
      dummy.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);
      dummy.scale.set(.15+rand()*.16,.18+rand()*.23,1);
      dummy.updateMatrix();leaves.current.setMatrixAt(i,dummy.matrix);
      color.setHSL(.22+rand()*.07,.25+rand()*.25,.15+rand()*.17);leaves.current.setColorAt(i,color);
    }
    leaves.current.instanceMatrix.needsUpdate=true;
  },[seed]);
  return <group position={at}>
    <mesh position={[0,2.8,0]} castShadow><cylinderGeometry args={[.16,.4,5.6,12]}/><meshStandardMaterial color="#655a43" roughness={1}/></mesh>
    {[0,1,2,3,4].map(i=><group key={i} rotation={[0,i*1.26,0]}><mesh position={[.8,4.8,0]} rotation={[0,0,-.65]} castShadow><cylinderGeometry args={[.05,.14,3,8]}/><meshStandardMaterial color="#655a43"/></mesh></group>)}
    <instancedMesh ref={leaves} args={[undefined,undefined,2600]} castShadow receiveShadow><shapeGeometry args={[leafShape,3]}/><meshStandardMaterial roughness={.9} side={THREE.DoubleSide}/></instancedMesh>
    <mesh position={[0,.25,0]} receiveShadow castShadow><cylinderGeometry args={[1.6,1.7,.5,32]}/><meshStandardMaterial color="#a49b84" roughness={1}/></mesh>
    <mesh position={[0,.51,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.45,32]}/><meshStandardMaterial color="#5f5942"/></mesh>
  </group>;
}
export const World = memo(function World() {
  const [map,normalMap,roughnessMap]=useSurface('cobblestone_floor_08',15);
  return <>
    <mesh renderOrder={-100}>
      <sphereGeometry args={[190,32,16]}/>
      <shaderMaterial side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false}
        vertexShader={`varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec3 direction; void main(){vec3 d=normalize(direction); float h=pow(clamp(d.y,0.,1.),.45); vec3 sky=mix(vec3(.78,.86,.88),vec3(.22,.52,.77),h); float sun=pow(max(dot(d,normalize(vec3(-35.,48.,30.))),0.),32.); sky+=vec3(.16,.12,.05)*sun; gl_FragColor=vec4(sky,1.);}`}/>
    </mesh>
    {/* Layered, softly lit cloud volumes surround the courtyard in every direction. */}
    <Clouds texture="/textures/cloud.png" limit={280} material={THREE.MeshBasicMaterial}>
      {Array.from({length:10},(_,i)=>{
        const angle=i*Math.PI/5;
        return <Cloud key={i} seed={17+i*13} position={[Math.cos(angle)*92,24+(i%3)*7,Math.sin(angle)*92]} bounds={[17,2.5,6]} segments={24} volume={22} smallestVolume={.45} opacity={.8} speed={.025} growth={1} fade={10} color="#ffffff"/>;
      })}
      <Cloud seed={91} position={[-28,48,-48]} bounds={[25,2,12]} segments={32} volume={12} opacity={.4} speed={.018} color="#fffaf0"/>
    </Clouds>
    <fog attach="fog" args={['#c6c8bc',55,160]}/>
    <hemisphereLight args={['#dce8f0','#9a8d72',2.1]}/>
    <directionalLight position={[-35,48,30]} color="#ffdfae" intensity={2.6} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={36} shadow-camera-bottom={-36} shadow-camera-far={140} shadow-normalBias={.035} shadow-bias={-.0002}/>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[500,500]}/><meshStandardMaterial color="#a69a7e" roughness={1}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]} receiveShadow><planeGeometry args={[44,44]}/><meshStandardMaterial map={map} normalMap={normalMap} roughnessMap={roughnessMap} normalScale={[.65,.65]} color="#c5b99b"/></mesh>
    {[-1,1].map(side=><group key={side}><mesh position={[side*20,.035,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.12,40]}/><meshStandardMaterial color="#e0cba4"/></mesh><mesh position={[0,.035,side*20]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[40,.12]}/><meshStandardMaterial color="#e0cba4"/></mesh></group>)}
    <StaticArchitecture>
    <StreetLife/>
    {[-18,-9,0,9,18].map((x,i)=><Building key={`north${i}`} x={x} z={-25} color={['#bc795f','#63aaa4','#c4a77a','#c29b52','#c49d94'][i]} label={[-18,-9,9].includes(x)?'':['','','TOWN SQUARE','','RAJU’S STORE'][i]} index={i}/>)}
    {[-18,-9,0,9,18].map((x,i)=><Building key={`s${i}`} x={x} z={25} rotation={Math.PI} color={i%2?'#aab1a0':'#c3b298'} label="STREET MARKET" index={i+2}/>)}
    {[-12,-3,6,15].map((z,i)=><group key={i}><Building x={-26} z={z} rotation={Math.PI/2} color="#b5ae98" label="DAILY NEEDS" index={i}/><Building x={26} z={z} rotation={-Math.PI/2} color="#c6b397" label="CORNER SHOP" index={i+1}/></group>)}
    {Array.from({length:13},(_,i)=><group key={`distant${i}`}><Block at={[-54+i*9,4+(i%3),-42]} size={[8.8,8+(i%3)*2,7]} color={i%2?'#b3ad99':'#c4b59c'}/><Block at={[-54+i*9,8.2+(i%3)*2,-42]} size={[9,.3,7.3]} color="#8f8f7d"/></group>)}
    </StaticArchitecture>
    <Tree at={[-21,0,-13]} seed={1}/><Tree at={[21,0,-12]} seed={4}/><Tree at={[-21,0,14]} seed={8}/><Tree at={[21,0,14]} seed={12}/>
    {[-19,19].map(z=><group key={z}>{[-1,0,1].map((v,i)=>{
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-25,10+i,z),new THREE.Vector3(0,8+i,z+v),new THREE.Vector3(25,10+i,z)]);
      return <mesh key={i}><tubeGeometry args={[curve,40,.018,4,false]}/><meshStandardMaterial color="#373d37"/></mesh>;
    })}</group>)}
  </>;
});
