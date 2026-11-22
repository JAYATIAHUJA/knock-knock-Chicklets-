import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './game.js';

test('computer friends are ready, marked publicly, and do not expose secrets',()=>{
 const g=new Game(3);g.add('human','You','#123456');g.addBots(2);
 assert.equal(g.members.size,3);assert.equal(g.public().players.filter(p=>p.bot&&p.ready).length,2);
 assert.deepEqual(g.public().players.filter(p=>p.bot).map(p=>p.avatar),['chintu','gudiya']);
 assert.throws(()=>g.addBots(9));assert.equal(g.members.size,3);
 g.ready('human',true);assert.equal(g.phase,'category');
 assert.ok(!JSON.stringify(g.public()).includes('identity'));
});
test('bots choose distinct identities and answer a real knock after a delay',()=>{
 const g=new Game(3);g.add('human','You','#123456');g.addBots(2);g.start();
 g.dennerId='human';for(const p of g.members.values())p.role=p.id==='human'?'denner':'other';
 g.chooseCategory('human','Cars');const now=Date.now();
 for(let i=0;i<300;i++)g.tick(now+i*17);
 assert.equal(g.phase,'guessing');const bots=[...g.members.values()].filter(p=>p.bot);
 assert.notEqual(bots[0].identity,bots[1].identity);
 g.member('human').position={x:0,z:0};bots[0].position={x:2.4,z:0};
 g.knock('human',bots[0].id,'Mahindra');g.tick(now+5100);assert.equal(g.phase,'knock');
 for(let i=0;i<90;i++)g.tick(now+5200+i*17);
 assert.equal(g.phase,'guessing');assert.equal(g.pendingKnock,null);
});
test('bot denner selects category, approaches and guesses without reading human secret',()=>{
 const g=new Game(3);g.add('human','You','#123456');g.addBots(2);g.start();
 const bot=[...g.members.values()].find(p=>p.bot)!;g.dennerId=bot.id;
 for(const p of g.members.values())p.role=p.id===bot.id?'denner':'other';
 const now=Date.now();for(let i=0;i<150;i++)g.tick(now+i*17);
 assert.equal(g.phase,'identity');g.chooseIdentity('human','Mahindra');
 for(let i=0;i<900&&g.public().phase!=='knock';i++)g.tick(now+3000+i*17);
 assert.equal(g.phase,'knock');assert.notEqual(g.pendingKnock?.name,'Mahindra');
});
test('runner bot moves and relays only to an assigned connected identity',()=>{
 const g=new Game(3);g.add('human','You','#123456');g.addBots(2);g.start();
 g.dennerId='human';for(const p of g.members.values())p.role=p.id==='human'?'denner':'other';
 g.chooseCategory('human','Cars');const bots=[...g.members.values()].filter(p=>p.bot);
 g.chooseIdentity(bots[0].id,'BMW');g.chooseIdentity(bots[1].id,'Fiat');
 g.member('human').position={x:0,z:0};bots[0].position={x:2.4,z:0};
 g.guess('human',bots[0].id,'BMW');const now=Date.now();
 for(let i=0;i<120;i++)g.tick(now+i*17);
 assert.ok(Math.hypot(bots[0].position.x-2.4,bots[0].position.z)>1);
 const originalRandom=Math.random;Math.random=()=>0;
 try{g.computers.tick(g,now+7000);assert.equal(g.runnerId,bots[0].id);g.member(bots[0].id).freezeUntil=0;g.computers.tick(g,now+14000);assert.equal(g.phase,'chase');assert.equal(g.runnerId,bots[1].id)}finally{Math.random=originalRandom}
});

test('spectator bots seek a safe spot instead of standing still during chase',()=>{
 const g=new Game(3);g.add('human','You','#123456');g.addBots(2);g.start();
 g.dennerId='human';for(const p of g.members.values())p.role=p.id==='human'?'denner':'other';
 g.chooseCategory('human','Cars');const bots=[...g.members.values()].filter(p=>p.bot);
 g.chooseIdentity(bots[0].id,'BMW');g.chooseIdentity(bots[1].id,'Fiat');
 g.member('human').position={x:0,z:0};bots[0].position={x:2,z:0};bots[1].position={x:8,z:0};
 g.guess('human',bots[0].id,'BMW');const now=Date.now();
 g.safeZones=[{id:'test',name:'Safe',x:10,z:0,radius:1,capacity:2,expiresAt:now+15000}];g.safeZoneNextRotationAt=now+15000;
 for(let i=0;i<100;i++)g.tick(now+i*17);
 assert.ok(bots[1].position.x>9,'spectator reached the safe spot');
 assert.equal(g.isPlayerSafe(bots[1],now+1700),true);
});
