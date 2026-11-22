import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';

function chase(){
 const g=new Game(3);
 for(const id of ['a','b','c'])g.add(id,id,'#123456');
 g.start();
 const denner=g.dennerId!,[runner,other]=[...g.members.keys()].filter(id=>id!==denner);
 g.chooseCategory(denner,'Fruits');g.chooseIdentity(runner,'Mango');g.chooseIdentity(other,'Guava');
 g.member(denner).position={x:0,z:0};g.member(runner).position={x:1,z:0};g.member(other).position={x:15,z:0};
 g.guess(denner,runner,'Mango');
 return {g,denner,runner,other};
}

test('relay choices include only assigned connected identities and stay private to the runner',()=>{
 const {g,denner,runner,other}=chase();
 assert.deepEqual(g.privateFor(runner).callNames,['Guava']);
 assert.deepEqual(g.privateFor(denner).callNames,[]);
 assert.deepEqual(g.privateFor(other).callNames,[]);
 assert.ok(!JSON.stringify(g.public()).includes('Guava'));
 g.disconnect(other);assert.deepEqual(g.privateFor(runner).callNames,[]);
 g.reconnect(other);assert.deepEqual(g.privateFor(runner).callNames,['Guava']);
 g.callName(runner,'Guava');
 assert.deepEqual(g.privateFor(other).callNames,['Mango']);
 assert.deepEqual(g.privateFor(runner).callNames,[]);
});

test('stale or unassigned relay choices are rejected without eliminating the runner',()=>{
 const {g,runner,other}=chase();
 assert.throws(()=>g.callName(runner,'Banana'),/available/i);
 assert.equal(g.phase,'chase');assert.equal(g.runnerId,runner);
 g.disconnect(other);
 assert.throws(()=>g.callName(runner,'Guava'),/available/i);
 assert.equal(g.phase,'chase');assert.equal(g.runnerId,runner);
});

test('Denner cannot move during the initial head start, then can move again',()=>{
 const {g,denner,runner}=chase();const d=g.member(denner),r=g.member(runner);
 d.velocity={x:5,z:0};d.input={seq:1,dx:1,dz:0,sprint:true};d.lastInputAt=0;
 const start={...d.position};
 assert.equal(g.input(denner,{seq:2,dx:1,dz:0,sprint:true}),false);
 g.tick(r.catchGraceUntil-1);assert.deepEqual(d.position,start);assert.deepEqual(d.velocity,{x:0,z:0});
 r.position={x:10,z:0};g.tick(r.catchGraceUntil);r.catchGraceUntil=0;g.chaseStartsAt=Date.now()-1;
 assert.equal(g.input(denner,{seq:3,dx:1,dz:0,sprint:false}),true);
});

test('relay protects the new runner without restarting the Denner freeze',()=>{
 const {g,denner,runner,other}=chase();
 g.chaseStartsAt=Date.now()-1;
 g.member(other).position={...g.member(denner).position};g.callName(runner,'Guava');
 assert.equal(g.input(denner,{seq:1,dx:1,dz:0,sprint:true}),true);
 g.tick(g.member(other).catchGraceUntil-1);assert.equal(g.phase,'chase');assert.equal(g.runnerId,other);
});

test('runner inside an active safe spot cannot be tagged in the tick or while calling a name',()=>{
 for(const viaCall of [false,true]){
  const {g,denner,runner,other}=chase();const now=Date.now();
  g.member(runner).catchGraceUntil=0;
  g.safeZones=[{id:'test',name:'Safe',x:0,z:0,radius:3,capacity:2,expiresAt:now+10000}];
  g.safeZoneNextRotationAt=now+10000;
  g.member(runner).position={x:3,z:0};g.member(denner).position={x:3.2,z:0};
  if(viaCall){g.callName(runner,'Guava');assert.equal(g.runnerId,other)}
  else {g.tick(now);assert.equal(g.runnerId,runner)}
  assert.equal(g.phase,'chase');
 }
});

test('spectators are protected inside safe spots but caught immediately outside',()=>{
 for(const x of [3,3.01]){
  const {g,denner,runner,other}=chase();const now=Date.now();
  g.member(runner).catchGraceUntil=0;g.member(runner).position={x:15,z:0};
  g.safeZones=[{id:'test',name:'Safe',x:0,z:0,radius:3,capacity:2,expiresAt:now+10000}];g.safeZoneNextRotationAt=now+10000;
  g.member(other).position={x,z:0};g.member(denner).position={x,z:0};g.tick(now);
  assert.equal(g.phase,x===3?'chase':'caught');
 }
});

test('expired safe spots no longer protect a runner',()=>{
 const {g,denner,runner}=chase();const now=Date.now();g.member(runner).catchGraceUntil=0;
 g.safeZones=[{id:'test',name:'Safe',x:0,z:0,radius:3,capacity:2,expiresAt:now-1}];g.safeZoneNextRotationAt=now+10000;
 assert.equal(g.isPlayerSafe(g.member(runner)),false);g.tick(now);assert.equal(g.phase,'caught');assert.equal(g.dennerId,runner);
});

test('next round clears old safe spots',()=>{
 const {g}=chase();g.catchRunner('Caught');g.nextRound();assert.deepEqual(g.public().safeZones,[]);
});
