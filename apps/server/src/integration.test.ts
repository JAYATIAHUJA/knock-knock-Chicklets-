import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {io,type Socket} from 'socket.io-client';

test('two clients share phases and a disconnected player resumes privately',async()=>{
 const port=31000+Math.floor(Math.random()*1000);
 const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port)},stdio:'ignore'});
 const clients:Socket[]=[];
 try{
  let ready=false;for(let i=0;i<50;i++){try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.equal(ready,true,'server started');
  const connect=()=>new Promise<Socket>((resolve,reject)=>{const s=io(`http://127.0.0.1:${port}`,{transports:['websocket'],timeout:3000});clients.push(s);s.once('connect',()=>resolve(s));s.once('connect_error',reject)});
  const emit=(s:Socket,event:string,value:unknown)=>new Promise<any>((resolve,reject)=>s.emit(event,value,(r:any)=>r.ok?resolve(r.data):reject(Error(r.error))));
  const a=await connect(),b=await connect();let latest:any=null,secret:any=null;a.on('room',r=>latest=r);b.on('private',r=>secret=r);
  const host=await emit(a,'create',{name:'A',color:'#db7857',dev:true});const guest=await emit(b,'join',{name:'B',color:'#6b9b78',code:host.code});
  await emit(a,'ready',true);await emit(b,'ready',true);
  assert.equal(latest.phase,'category');assert.equal(latest.players.length,2);assert.ok(latest.dennerId===host.playerId||latest.dennerId===guest.playerId);
  const denner=latest.dennerId===host.playerId?a:b,chooser=denner===a?b:a,chooserSession=denner===a?guest:host;
  denner.on('room',r=>latest=r);
  const startDenner=latest.players.find((p:any)=>p.id===latest.dennerId).position.x;
  const startFrozen=latest.players.find((p:any)=>p.id===chooserSession.playerId).position.x;
  denner.emit('input',{seq:1,dx:1,dz:0,sprint:false});chooser.emit('input',{seq:1,dx:1,dz:0,sprint:false});
  const movementDeadline=Date.now()+2000;
  while(latest.players.find((p:any)=>p.id===latest.dennerId).position.x<=startDenner+.3&&Date.now()<movementDeadline)await new Promise(r=>setTimeout(r,25));
  assert.ok(latest.players.find((p:any)=>p.id===latest.dennerId).position.x>startDenner+.3,'DENNER moved in shared snapshot');
  assert.equal(latest.players.find((p:any)=>p.id===chooserSession.playerId).position.x,startFrozen,'frozen player did not move');
  denner.emit('input',{seq:2,dx:0,dz:0,sprint:false});
  await emit(denner,'category','Fruits');await emit(chooser,'identity','Mango');assert.equal(latest.phase,'guessing');assert.equal(JSON.stringify(latest).includes('Mango'),false);
  const offline=new Promise<void>(resolve=>{const check=(r:any)=>{if(r.players.find((p:any)=>p.id===chooserSession.playerId)?.connected===false){denner.off('room',check);resolve()}};denner.on('room',check)});
  chooser.disconnect();await offline;
  const resumed=await connect();let restored:any=null;resumed.on('private',r=>restored=r);const response=await emit(resumed,'resume',chooserSession.token);
  assert.equal(response.playerId,chooserSession.playerId);assert.equal(restored.identity,'Mango');assert.equal(latest.players.find((p:any)=>p.id===chooserSession.playerId).connected,true);assert.equal(latest.phase,'guessing');
 }finally{for(const c of clients)c.disconnect();child.kill()}
});
