import { randomBytes } from 'node:crypto';
import {ComputerFriends} from './bots.js';

import { ARENA,CATEGORIES,canMove,caught,chooseDenner,stepMotion,outside,RELAY_LIMIT_MS,SAFE_ZONE_DURATION_MS,RUNNER_HEAD_START_MS,type PrivateState,type Category,type Input,type Player,type PublicRoom,type SafeZone,type Vec } from '@chicklets/shared';



type Member = Player & {identity:string|null;input:Input;velocity:Vec;lastSeq:number;lastInputAt:number;catchGraceUntil:number};

export class Game {

  computers=new ComputerFriends();

  addBots(count:number){if(this.phase!=='lobby'||!Number.isInteger(count)||count<0||count>3||this.members.size+count>8)throw Error('Choose up to 3 computer friends in the lobby');for(let i=0;i<count;i++){const id=`bot-${randomBytes(6).toString('hex')}`;this.add(id,['Chintu','Gudiya','Bunty'][i],['#6b9b78','#d4a047','#8296bd'][i]);const p=this.member(id);p.bot=true;p.ready=true}}

  code:string; members=new Map<string,Member>(); phase:PublicRoom['phase']='lobby'; category:Category|null=null; dennerId:string|null=null; runnerId:string|null=null; message='Gather your friends in the courtyard'; minPlayers:number; transitionAt=0; relayDeadline:number|null=null; chaseStartsAt=0; safeZones:SafeZone[]=[]; safeZoneNextRotationAt=0; bluffSignals:PublicRoom['bluffSignals']=[];

  pendingKnock:PublicRoom['knock']=null; speech:PublicRoom['speech']=null;

  constructor(minPlayers=5,code=randomBytes(3).toString('hex').toUpperCase()){this.minPlayers=minPlayers;this.code=code}

  add(id:string,name:string,color:string){if(this.phase!=='lobby')throw Error('Round already started');if(this.members.size>=8)throw Error('Room is full');if(!name.trim()||name.length>20)throw Error('Name must be 1â€“20 characters');if(!/^#[0-9a-fA-F]{6}$/.test(color))throw Error('Invalid colour');const n=this.members.size;this.members.set(id,{id,name:name.trim(),color,stamina:100,catchGraceUntil:0,ready:false,connected:true,position:{x:(n%4-1.5)*2.2,z:Math.floor(n/4)*2.2},role:'other',identity:null,input:{seq:0,dx:0,dz:0,sprint:false},velocity:{x:0,z:0},lastSeq:0,lastInputAt:0});return this.public()}

  remove(id:string){const wasDenner=id===this.dennerId,wasRunner=id===this.runnerId;this.members.delete(id);if(this.members.size<this.minPlayers){this.reset('Waiting for more players');return}if(wasDenner||wasRunner||this.phase==='identity'||this.phase==='knock'||this.phase==='caught'){this.reset('A player left. Ready up for a new round.')}else if(this.phase==='guessing'&&this.members.size-1===0){this.reset('Waiting for more players')} }

  disconnect(id:string){if(this.pendingKnock&&(id===this.pendingKnock.targetId||id===this.dennerId)){this.pendingKnock=null;this.phase='guessing'}const p=this.member(id);p.connected=false;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};p.velocity={x:0,z:0};this.message=`${p.name} disconnected. Waiting briefly for them to return.`}

  reconnect(id:string){const p=this.member(id);p.connected=true;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};this.message=this.phase==='category'?`${this.member(this.dennerId!).name} is the DENNER. Pick a category!`:this.phase==='knock'&&this.pendingKnock?`Knock knock! ${this.member(this.pendingKnock.targetId).name}, kya tum ${this.pendingKnock.name} ho?`:this.phase==='identity'?'Choose your secret identity':this.phase==='guessing'?'DENNER: approach a player and guess their identity':this.phase==='chase'?`${this.member(this.runnerId!).name} is running! Catch them!`:this.phase==='caught'?`${this.member(this.dennerId!).name} is the new DENNER.`:'Gather your friends in the courtyard'}

  ready(id:string,value:boolean){const p=this.member(id);if(this.phase!=='lobby')throw Error('Round already started');p.ready=!!value;if(this.members.size>=this.minPlayers&&[...this.members.values()].every(p=>p.ready))this.start();}

  start(){this.computers.reset();this.dennerId=chooseDenner([...this.members.keys()]);this.runnerId=null;this.category=null;this.phase='category';this.message=`${this.member(this.dennerId).name} is the DENNER. Pick a category!`;for(const p of this.members.values()){p.role=p.id===this.dennerId?'denner':'other';p.identity=null;p.position=this.spawnPosition(p.id);p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  chooseCategory(id:string,category:Category){if(this.phase!=='category'||id!==this.dennerId)throw Error('Only the DENNER can choose now');if(!Object.hasOwn(CATEGORIES,category))throw Error('Invalid category');this.category=category;this.phase='identity';this.message='Choose your secret identity';}

  chooseIdentity(id:string,identity:string){if(this.phase!=='identity'||id===this.dennerId||!this.category)throw Error('Cannot choose now');if(!(CATEGORIES[this.category] as readonly string[]).includes(identity))throw Error('Invalid identity');if([...this.members.values()].some(p=>p.id!==id&&p.identity===identity))throw Error('That name is taken. Choose another secret.');this.member(id).identity=identity;if([...this.members.values()].filter(p=>p.id!==this.dennerId).every(p=>p.identity)){this.phase='guessing';this.message='DENNER: approach a player and guess their identity';}}

  guess(id:string,targetId:string,identity:string){
    if(this.phase!=='guessing'||id!==this.dennerId||targetId===id)throw Error('Guess unavailable');
    const target=this.member(targetId),denner=this.member(id);
    if(Math.hypot(target.position.x-denner.position.x,target.position.z-denner.position.z)>2.5)throw Error('Move closer to guess');
    if(!this.category||(CATEGORIES[this.category] as readonly string[]).includes(identity)===false)throw Error('Invalid identity');
    if(target.identity!==identity){
      this.message=`Wrong guess for ${target.name}. Try again!`;
      return false;
    }
    this.runnerId=targetId;
    target.role='runner';target.catchGraceUntil=Date.now()+RUNNER_HEAD_START_MS;
    this.chaseStartsAt=target.catchGraceUntil;
    this.phase='chase';
    this.relayDeadline=Date.now()+RELAY_LIMIT_MS;
    this.generateSafeZones(Date.now());
    this.message=`${target.name} is running! Baaki log Safe Spots (Oonch) par chado!`;
    return true;
  }

  knock(id:string,targetId:string,name:string){

    if(this.phase!=='guessing'||id!==this.dennerId||targetId===id)throw Error('Knock unavailable');

    const target=this.member(targetId),denner=this.member(id);

    if(!target.connected||!denner.connected)throw Error('That player is offline');

    if(Math.hypot(target.position.x-denner.position.x,target.position.z-denner.position.z)>2.5)throw Error('Thoda paas aao to knock');

    if(!this.category||!(CATEGORIES[this.category] as readonly string[]).includes(name))throw Error('Invalid name');

    if(target.identity===name){this.guess(id,targetId,name);return}
    this.pendingKnock={id:randomBytes(8).toString('hex'),dennerId:id,targetId,name,expiresAt:Date.now()+12000};

    this.phase='knock';this.speech=null;this.bluffSignals=[];

    for(const p of this.members.values()){p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false};p.velocity={x:0,z:0}}

    this.message=`Knock knock! ${target.name}, kya tum ${name} ho?`;

  }

  sendBluffSignal(id:string,type:'nod'|'fake'|'whisper',text?:string){
    if(this.phase!=='knock'||!this.pendingKnock)throw Error('Bluff signals only available during knock');
    if(id===this.dennerId||id===this.pendingKnock.targetId)throw Error('Only observers can bluff');
    const sender=this.member(id);
    const target=this.member(this.pendingKnock.targetId);
    const signalText = type==='nod'?`${sender.name}: "Haan, yahi hai! Pakka!"`
      :type==='fake'?`${sender.name}: "Nahi nahi, galat banda hai!"`
      :(text?.trim()||`${sender.name} ne ishara kiya...`);

    const signal = {
      fromId: id,
      targetId: this.pendingKnock.targetId,
      type,
      text: signalText,
      expiresAt: Date.now()+5000
    };

    if(!this.bluffSignals) this.bluffSignals=[];
    this.bluffSignals.push(signal);
    this.speech={playerId:id,text:signalText,expiresAt:Date.now()+4000};
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

    if(Date.now()>=runner.catchGraceUntil&&!this.isPlayerSafe(runner)&&caught(this.member(this.dennerId!).position,runner.position)){this.catchRunner('Pakde gaye!');return}

    const target=[...this.members.values()].find(p=>p.id!==id&&p.id!==this.dennerId&&p.identity===name&&p.connected);

    if(!target)throw Error('That relay name is no longer available');

    this.speech={playerId:id,text:`${name}!`,expiresAt:Date.now()+4000};

    runner.role='other';runner.input={seq:runner.lastSeq,dx:0,dz:0,sprint:false};runner.velocity={x:0,z:0};

    target.role='runner';target.catchGraceUntil=Date.now()+RUNNER_HEAD_START_MS;target.input={seq:target.lastSeq,dx:0,dz:0,sprint:false};target.velocity={x:0,z:0};

    this.runnerId=target.id;
    this.relayDeadline=Date.now()+RELAY_LIMIT_MS;
    this.message=`${runner.name}: ${name}! Ab ${target.name} ki baari — bhaago! (20s timer reset)`;

  }

  input(id:string,input:Input){const p=this.member(id),now=Date.now();if(!p.connected||!canMove(this.phase,id,this.dennerId,this.runnerId,this.chaseStartsAt,now))return false;if(!Number.isInteger(input.seq)||input.seq<=p.lastSeq||!Number.isFinite(input.dx)||!Number.isFinite(input.dz)||Math.abs(input.dx)>1||Math.abs(input.dz)>1||typeof input.sprint!=='boolean')return false;if(now-p.lastInputAt<12)return false;p.lastInputAt=now;p.lastSeq=input.seq;p.input=input;return true}

  tick(now=Date.now()){
    this.computers.tick(this,now);
    if(this.speech&&now>=this.speech.expiresAt)this.speech=null;
    if(this.pendingKnock&&now>=this.pendingKnock.expiresAt){
      const k=this.pendingKnock;
      this.replyKnock(k.targetId,k.id,'…');
      return;
    }
    if(this.phase==='caught'&&now>=this.transitionAt){
      this.nextRound();
      return;
    }
    for(const p of this.members.values()){
      if(!p.connected||!canMove(this.phase,p.id,this.dennerId,this.runnerId,this.chaseStartsAt,now)){
        p.velocity={x:0,z:0};
        continue;
      }
      const isSpectator = this.phase==='chase' && p.id!==this.dennerId && p.id!==this.runnerId;
      if(!p.bot&&now-p.lastInputAt>250)p.input={...p.input,dx:0,dz:0,sprint:false};
      const sprinting=p.input.sprint&&(p.input.dx!==0||p.input.dz!==0);
      p.stamina=Math.max(0,Math.min(100,p.stamina+(sprinting?-42:24)/60));
      if(p.stamina<=0)p.input.sprint=false;
      const next=stepMotion(p.position,p.velocity,p.input,undefined,isSpectator);
      p.velocity=next.velocity;
      if(this.phase==='chase'&&p.id===this.runnerId&&outside(next.position)){
        this.catchRunner('The runner crossed the boundary!');
        return;
      }
      p.position={
        x:Math.max(-ARENA,Math.min(ARENA,next.position.x)),
        z:Math.max(-ARENA,Math.min(ARENA,next.position.z))
      };
      if(Math.abs(p.position.x)===ARENA)p.velocity.x=0;
      if(Math.abs(p.position.z)===ARENA)p.velocity.z=0;
    }
    // Rotate Safe Zones every 15s during chase
    if(this.phase==='chase'&&now>=this.safeZoneNextRotationAt){
      this.generateSafeZones(now);
      this.message='Safe Spots Badle! Naye spot par bhaago!';
    }
    // 20-second Relay Hot Potato Timeout
    if(this.phase==='chase'&&this.runnerId&&this.relayDeadline&&now>=this.relayDeadline){
      const runner=this.member(this.runnerId);
      this.catchRunner(`${runner.name} ne 20s mein naam pass nahi kiya — Time Over!`);
      return;
    }
    // Tag check: Denner catches Runner
    if(this.phase==='chase'&&this.dennerId&&this.runnerId&&now>=this.member(this.runnerId).catchGraceUntil&&!this.isPlayerSafe(this.member(this.runnerId),now)&&caught(this.member(this.dennerId).position,this.member(this.runnerId).position)) {
      this.catchRunner('Caught!');
      return;
    }
    // Tag check: Denner can also tag any Spectator who is OUT of Safe Zone!
    if(this.phase==='chase'&&this.dennerId){
      const dennerPos = this.member(this.dennerId).position;
      for(const p of this.members.values()){
        if(p.id!==this.dennerId && p.id!==this.runnerId && p.connected && now>=this.member(this.runnerId!).catchGraceUntil && !this.isPlayerSafe(p,now)){
          if(caught(dennerPos, p.position)){
            this.runnerId = p.id; // Target switched to caught spectator!
            this.catchRunner(`Safe zone ke bahar pakde gaye! ${p.name} is OUT!`);
            return;
          }
        }
      }
    }
  }

  nextRound(){this.computers.reset();this.pendingKnock=null;this.speech=null;this.phase='category';this.category=null;this.runnerId=null;this.relayDeadline=null;this.safeZones=[];this.bluffSignals=[];this.message=`${this.member(this.dennerId!).name} is the new DENNER. Pick a category!`;for(const p of this.members.values()){p.identity=null;p.position=this.spawnPosition(p.id);p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  catchRunner(reason:string){if(!this.runnerId)return;const runner=this.member(this.runnerId);this.dennerId=this.runnerId;this.runnerId=null;this.relayDeadline=null;for(const p of this.members.values()){p.role=p.id===this.dennerId?'denner':'other';p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}this.phase='caught';this.message=`${reason} ${runner.name} is the new DENNER.`;this.transitionAt=Date.now()+3500}

  reset(message:string){this.computers.reset();this.pendingKnock=null;this.speech=null;this.phase='lobby';this.category=null;this.dennerId=null;this.runnerId=null;this.relayDeadline=null;this.safeZones=[];this.bluffSignals=[];this.message=message;for(const p of this.members.values()){p.ready=!!p.bot;p.role='other';p.identity=null;p.input={seq:p.lastSeq,dx:0,dz:0,sprint:false}}}

  member(id:string){const p=this.members.get(id);if(!p)throw Error('Player not in room');return p}

  generateSafeZones(now:number){
    const spots = [
      {id:'sz-charpai',name:'Charpai / Oonch',x:-10,z:8,radius:3.2,capacity:2},
      {id:'sz-peepal',name:'Peepal Chabootra',x:12,z:-10,radius:3.4,capacity:2},
      {id:'sz-handpump',name:'Handpump Corner',x:-12,z:-8,radius:3.0,capacity:2},
      {id:'sz-chowk',name:'Chowk Platform',x:8,z:10,radius:3.2,capacity:2},
    ];
    // Pick 2 random active spots
    const shuffled = [...spots].sort(()=>Math.random()-.5);
    this.safeZones = shuffled.slice(0,2).map(s=>({...s, expiresAt: now + SAFE_ZONE_DURATION_MS}));
    this.safeZoneNextRotationAt = now + SAFE_ZONE_DURATION_MS;
  }

  isPlayerSafe(p:Member,now=Date.now()):boolean{
    if(p.id===this.dennerId) return false;
    for(const sz of this.safeZones){
      const dist = Math.hypot(p.position.x-sz.x, p.position.z-sz.z);
      if(now<sz.expiresAt&&dist <= sz.radius){
        return true;
      }
    }
    return false;
  }

  spawnPosition(id:string){const index=[...this.members.keys()].indexOf(id);const angle=index/this.members.size*Math.PI*2;return {x:Math.sin(angle)*5,z:Math.cos(angle)*5}}

  public():PublicRoom{
    return {
      code:this.code,
      phase:this.phase,
      category:this.category,
      dennerId:this.dennerId,
      runnerId:this.runnerId,
      message:this.message,
      minPlayers:this.minPlayers,
      knock:this.pendingKnock,
      speech:this.speech,
      relayDeadline:this.relayDeadline,
      chaseStartsAt:this.runnerId?this.chaseStartsAt:null,
      safeZones:this.safeZones,
      bluffSignals:this.bluffSignals,
      players:[...this.members.values()].map(({identity,input,lastInputAt,...p})=>p)
    };
  }

  privateFor(id:string):PrivateState{
    return {identity:this.member(id).identity,callNames:this.phase==='chase'&&id===this.runnerId
      ?[...this.members.values()].filter(p=>p.connected&&p.id!==id&&p.id!==this.dennerId&&p.identity).map(p=>p.identity!).sort()
      :[]};
  }

}

