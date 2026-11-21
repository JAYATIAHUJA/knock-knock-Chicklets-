import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {io,type Socket} from 'socket.io-client';

test('three sockets complete knock, custom reply, relay and wrong-call elimination',async()=>{
 const port=33000+Math.floor(Math.random()*1000),clients:Socket[]=[];
 const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port)},stdio:'ignore'});
 const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
 const until=async(check:()=>boolean)=>{const end=Date.now()+6000;while(!check()){if(Date.now()>end)throw Error('Timed out waiting for game state');await pause(25)}};
 try{
  let up=false;await until(()=>up||(void fetch(`http://127.0.0.1:${port}/health`).then(r=>{up=r.ok}).catch(()=>{}),false));
  const connect=()=>new Promise<Socket>((resolve,reject)=>{const s=io(`http://127.0.0.1:${port}`,{transports:['websocket']});clients.push(s);s.once('connect',()=>resolve(s));s.once('connect_error',reject)});
  const send=(s:Socket,event:string,data:unknown)=>new Promise<any>((resolve,reject)=>s.timeout(3000).emit(event,data,(err:any,r:any)=>err?reject(err):r.ok?resolve(r.data):reject(Error(r.error))));
  const sockets=[await connect(),await connect(),await connect()];let room:any=null;sockets[0].on('room',r=>room=r);
  const sessions=[await send(sockets[0],'create',{name:'Chintu',color:'#aa5533',dev:true})];
  for(let i=1;i<3;i++)sessions.push(await send(sockets[i],'join',{code:sessions[0].code,name:['','Bunty','Gudiya'][i],color:'#448866'}));
  for(const s of sockets)await send(s,'ready',true);await until(()=>room?.phase==='category');
  const di=sessions.findIndex(s=>s.playerId===room.dennerId),others=[0,1,2].filter(i=>i!==di),[ri,ni]=others;
  await send(sockets[di],'category','Cars');await send(sockets[ri],'identity','Maruti');await send(sockets[ni],'identity','BMW');await until(()=>room.phase==='guessing');
  assert.ok(!JSON.stringify(room).includes('Maruti'));
  let seq=1;const moving=setInterval(()=>{const d=room.players.find((p:any)=>p.id===sessions[di].playerId).position,r=room.players.find((p:any)=>p.id===sessions[ri].playerId).position,dx=r.x-d.x,dz=r.z-d.z,len=Math.hypot(dx,dz);sockets[di].emit('input',{seq:seq++,dx:len>2.1?dx/len:0,dz:len>2.1?dz/len:0,sprint:false})},35);
  try{await until(()=>{const d=room.players.find((p:any)=>p.id===sessions[di].playerId).position,r=room.players.find((p:any)=>p.id===sessions[ri].playerId).position;return Math.hypot(d.x-r.x,d.z-r.z)<2.2})}finally{clearInterval(moving)}
  await pause(40);sockets[di].emit('input',{seq:seq++,dx:0,dz:0,sprint:false});await pause(80);
  await send(sockets[di],'guess',{targetId:sessions[ri].playerId,identity:'Fiat'});await until(()=>room.phase==='knock');
  const knockId=room.knock.id;await assert.rejects(send(sockets[ni],'knock-reply',{knockId,text:'spoofed'}));
  await send(sockets[ri],'knock-reply',{knockId,text:'Wrong address!'});await until(()=>room.phase==='guessing');
  await send(sockets[di],'guess',{targetId:sessions[ri].playerId,identity:'Maruti'});await until(()=>room.phase==='chase');
  assert.equal(room.knock,null);
  await send(sockets[ri],'call-name','BMW');await until(()=>room.runnerId===sessions[ni].playerId);assert.equal(room.players.find((p:any)=>p.id===sessions[ri].playerId).role,'other');
  await send(sockets[ni],'call-name','Fiat');await until(()=>room.phase==='caught');assert.equal(room.dennerId,sessions[ni].playerId);
 }finally{clients.forEach(s=>s.disconnect());child.kill()}
});
