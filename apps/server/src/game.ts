import { randomBytes } from 'node:crypto';
import {ComputerFriends} from './bots.js';

import { ARENA,CATEGORIES,canMove,caught,chooseDenner,stepMotion,outside,type Category,type Input,type Player,type PublicRoom,type Vec } from '@chicklets/shared';



type Member = Player & {identity:string|null;input:Input;velocity:Vec;lastSeq:number;lastInputAt:number};

export class Game {

  computers=new ComputerFriends();

  addBots(count:number){if(this.phase!=='lobby'||!Number.isInteger(count)||count<0||count>3||this.members.size+count>8)throw Error('Choose up to 3 computer friends in the lobby');for(let i=0;i<count;i++){const id=`bot-${randomBytes(6).toString('hex')}`;this.add(id,['Chintu','Gudiya','Bunty'][i],['#6b9b78','#d4a047','#8296bd'][i]);const p=this.member(id);p.bot=true;p.ready=true}}

  code:string; members=new Map<string,Member>(); phase:PublicRoom['phase']='lobby'; category:Category|null=null; dennerId:string|null=null; runnerId:string|null=null; message='Gather your friends in the courtyard'; minPlayers:number; transitionAt=0;

  pendingKnock:PublicRoom['knock']=null; speech:PublicRoom['speech']=null;

  constructor(minPlayers=5,code=randomBytes(3).toString('hex').toUpperCase()){this.minPlayers=minPlayers;this.code=code}

  add(id:string,name:string,color:string){if(this.phase!=='lobby')throw Error('Round already started');if(this.members.size>=8)throw Error('Room is full');if(!name.trim()||name.length>20)throw Error('Name must be 1â€“20 characters');if(!/^#[0-9a-fA-F]{6}$/.test(color))throw Error('Invalid colour');const n=this.members.size;this.members.set(id,{id,name:name.trim(),color,ready:false,connected:true,position:{x:(n%4-1.5)*2.2,z:Math.floor(n/4)*2.2},role:'other',identity:null,input:{seq:0,dx:0,dz:0,sprint:false},velocity:{x:0,z:0},lastSeq:0,lastInputAt:0});return this.public()}

  remove(id:string){const wasDenner=id===this.dennerId,wasRunner=id===this.runnerId;this.members.delete(id);if(this.members.size<this.minPlayers){this.reset('Waiting for more players');return}if(wasDenner||wasRunner||this.phase==='identity'||this.phase==='knock'||this.phase==='caught'){this.reset('A player left. Ready up for a new round.')}else if(this.phase==='guessing'&&this.members.size-1===0){this.reset('Waiting for more players')} }

  disconnect(id:string){if(this.pendingKnock&&(id===this.pendingKnock.targetId||id===this.dennerId)){this.pendingKnock=null;this.phase='guessing'}const p=this.member(id);p.connected=false;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};p.velocity={x:0,z:0};this.message=`${p.name} disconnected. Waiting briefly for them to return.`}

  reconnect(id:string){const p=this.member(id);p.connected=true;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};this.message=this.phase==='category'?`${this.member(this.dennerId!).name} is the DENNER. Pick a category!`:this.phase==='knock'&&this.pendingKnock?`Knock knock! ${this.member(this.pendingKnock.targetId).name}, kya tum ${this.pendingKnock.name} ho?`:this.phase==='identity'?'Choose your secret identity':this.phase==='guessing'?'DENNER: approach a player and guess their identity':this.phase==='chase'?`${this.member(this.runnerId!).name} is running! Catch them!`:this.phase==='caught'?`${this.member(this.dennerId!).name} is the new DENNER.`:'Gather your friends in the courtyard'}

  ready(id:string,value:boolean){const p=this.member(id);if(this.phase!=='lobby')throw Error('Round already started');p.ready=!!value;if(this.members.size>=this.minPlayers&&[...this.members.values()].every(p=>p.ready))this.start();}

  start(){this.computers.reset();this.dennerId=chooseDenner([...this.members.keys()]);this.runnerId=null;this.category=null;this.phase='category';this.message=`${this.member(this.dennerId).name} is the DENNER. Pick a category!`;for(const p of this.members.values()){p.role=p.id===this.dennerId?'denner':'other';p.identity=null;p.position=this.spawnPosition(p.id);p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  chooseCategory(id:string,category:Category){if(this.phase!=='category'||id!==this.dennerId)throw Error('Only the DENNER can choose now');if(!Object.hasOwn(CATEGORIES,category))throw Error('Invalid category');this.category=category;this.phase='identity';this.message='Choose your secret identity';}

  chooseIdentity(id:string,identity:string){if(this.phase!=='identity'||id===this.dennerId||!this.category)throw Error('Cannot choose now');if(!(CATEGORIES[this.category] as readonly string[]).includes(identity))throw Error('Invalid identity');if([...this.members.values()].some(p=>p.id!==id&&p.identity===identity))throw Error('That name is taken. Choose another secret.');this.member(id).identity=identity;if([...this.members.values()].filter(p=>p.id!==this.dennerId).every(p=>p.identity)){this.phase='guessing';this.message='DENNER: approach a player and guess their identity';}}

  guess(id:string,targetId:string,identity:string){if(this.phase!=='guessing'||id!==this.dennerId||targetId===id)throw Error('Guess unavailable');const target=this.member(targetId),denner=this.member(id);if(Math.hypot(target.position.x-denner.position.x,target.position.z-denner.position.z)>2.5)throw Error('Move closer to guess');if(!this.category||(CATEGORIES[this.category] as readonly string[]).includes(identity)===false)throw Error('Invalid identity');if(target.identity!==identity){this.message=`Wrong guess for ${target.name}. Try again!`;return false}this.runnerId=targetId;target.role='runner';this.phase='chase';this.message=`${target.name} is running! Catch them!`;return true}

  knock(id:string,targetId:string,name:string){

    if(this.phase!=='guessing'||id!==this.dennerId||targetId===id)throw Error('Knock unavailable');

    const target=this.member(targetId),denner=this.member(id);

    if(!target.connected||!denner.connected)throw Error('That player is offline');

    if(Math.hypot(target.position.x-denner.position.x,target.position.z-denner.position.z)>2.5)throw Error('Thoda paas aao to knock');

    if(!this.category||!(CATEGORIES[this.category] as readonly string[]).includes(name))throw Error('Invalid name');

    this.pendingKnock={id:randomBytes(8).toString('hex'),dennerId:id,targetId,name,expiresAt:Date.now()+12000};

    this.phase='knock';this.speech=null;

    for(const p of this.members.values()){p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};p.velocity={x:0,z:0}}

    this.message=`Knock knock! ${target.name}, kya tum ${name} ho?`;

  }

  replyKnock(id:string,knockId:string,text:string){

    const knock=this.pendingKnock;

    if(this.phase!=='knock'||!knock||knock.targetId!==id||knock.id!==knockId)throw Error('This knock is not for you');

    if(typeof text!=='string'||text.trim().length>120)throw Error('Reply must be at most 120 characters');

    this.speech={playerId:id,text:text.trim()||'Achha ji?',expiresAt:Date.now()+5000};

    this.pendingKnock=null;this.phase='guessing';

    this.guess(knock.dennerId,knock.targetId,knock.name);

  }

  callName(id:string,name:string){

    if(this.phase!=='chase'||id!==this.runnerId||!this.member(id).connected)throw Error('Only the runner can call a name');

    const runner=this.member(id);

    if(typeof name!=='string'||!name.trim()||name.length>40)throw Error('Invalid call');

    if(name===runner.identity)throw Error('You cannot call your own name');

    if(caught(this.member(this.dennerId!).position,runner.position)){this.catchRunner('Pakde gaye!');return}

    const target=[...this.members.values()].find(p=>p.id!==id&&p.id!==this.dennerId&&p.identity===name&&p.connected);

    this.speech={playerId:id,text:`${name}!`,expiresAt:Date.now()+4000};

    if(!target){this.catchRunner(`${name}? Galat naam — out!`);return}

    runner.role='other';runner.input={seq:runner.lastSeq,dx:0,dz:0,sprint:false};runner.velocity={x:0,z:0};

    target.role='runner';target.input={seq:target.lastSeq,dx:0,dz:0,sprint:false};target.velocity={x:0,z:0};

    this.runnerId=target.id;this.message=`${runner.name}: ${name}! Ab ${target.name} ki baari — bhaago!`;

  }

  input(id:string,input:Input){const p=this.member(id),now=Date.now();if(!p.connected||!canMove(this.phase,id,this.dennerId,this.runnerId))return false;if(!Number.isInteger(input.seq)||input.seq<=p.lastSeq||!Number.isFinite(input.dx)||!Number.isFinite(input.dz)||Math.abs(input.dx)>1||Math.abs(input.dz)>1||typeof input.sprint!=='boolean')return false;if(now-p.lastInputAt<12)return false;p.lastInputAt=now;p.lastSeq=input.seq;p.input=input;return true}

  tick(now=Date.now()){this.computers.tick(this,now);if(this.speech&&now>=this.speech.expiresAt)this.speech=null;if(this.pendingKnock&&now>=this.pendingKnock.expiresAt){const k=this.pendingKnock;this.replyKnock(k.targetId,k.id,'…');return}if(this.phase==='caught'&&now>=this.transitionAt){this.nextRound();return}for(const p of this.members.values()){if(!p.connected||!canMove(this.phase,p.id,this.dennerId,this.runnerId)){p.velocity={x:0,z:0};continue}const next=stepMotion(p.position,p.velocity,p.input);p.velocity=next.velocity;if(this.phase==='chase'&&p.id===this.runnerId&&outside(next.position)){this.catchRunner('The runner crossed the boundary!');return}p.position={x:Math.max(-ARENA,Math.min(ARENA,next.position.x)),z:Math.max(-ARENA,Math.min(ARENA,next.position.z))};if(Math.abs(p.position.x)===ARENA)p.velocity.x=0;if(Math.abs(p.position.z)===ARENA)p.velocity.z=0}if(this.phase==='chase'&&this.dennerId&&this.runnerId&&caught(this.member(this.dennerId).position,this.member(this.runnerId).position))this.catchRunner('Caught!')}

  nextRound(){this.computers.reset();this.pendingKnock=null;this.speech=null;this.phase='category';this.category=null;this.runnerId=null;this.message=`${this.member(this.dennerId!).name} is the new DENNER. Pick a category!`;for(const p of this.members.values()){p.identity=null;p.position=this.spawnPosition(p.id);p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  catchRunner(reason:string){if(!this.runnerId)return;const runner=this.member(this.runnerId);this.dennerId=this.runnerId;this.runnerId=null;for(const p of this.members.values()){p.role=p.id===this.dennerId?'denner':'other';p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}this.phase='caught';this.message=`${reason} ${runner.name} is the new DENNER.`;this.transitionAt=Date.now()+3500}

  reset(message:string){this.computers.reset();this.pendingKnock=null;this.speech=null;this.phase='lobby';this.category=null;this.dennerId=null;this.runnerId=null;this.message=message;for(const p of this.members.values()){p.ready=!!p.bot;p.role='other';p.identity=null;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  member(id:string){const p=this.members.get(id);if(!p)throw Error('Player not in room');return p}

  spawnPosition(id:string){const index=[...this.members.keys()].indexOf(id);const angle=index/this.members.size*Math.PI*2;return {x:Math.sin(angle)*5,z:Math.cos(angle)*5}}

  public():PublicRoom{return {code:this.code,phase:this.phase,category:this.category,dennerId:this.dennerId,runnerId:this.runnerId,message:this.message,minPlayers:this.minPlayers,knock:this.pendingKnock,speech:this.speech,players:[...this.members.values()].map(({identity,input,velocity,lastSeq,lastInputAt,...p})=>p)}}

  privateFor(id:string){return {identity:this.member(id).identity}}

}

