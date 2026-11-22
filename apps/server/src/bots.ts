import {ARENA,CATEGORIES,type Vec} from '@chicklets/shared';
import type {Game} from './game.js';

/** Local rule-based opponents. No external AI service or hidden-name lookup. */
export class ComputerFriends {
 private state=''; private since=0; private nextAction=0; private nextMove=0;
 private attempts=new Map<string,number>();
 private known=new Map<string,string>();
 private lastKnock:{targetId:string;name:string}|null=null;
 reset(){this.state='';this.attempts.clear();this.known.clear();this.lastKnock=null}
 tick(g:Game,now:number){
  const players=[...g.members.values()];
  if(!players.some(p=>p.bot)||!players.some(p=>!p.bot&&p.connected))return;
  const key=`${g.phase}:${g.runnerId}:${g.pendingKnock?.id??''}`;
  if(key!==this.state){
   if(g.phase==='chase'&&this.lastKnock&&g.runnerId===this.lastKnock.targetId)this.known.set(g.runnerId,this.lastKnock.name);
   if(g.phase==='knock'&&g.pendingKnock)this.lastKnock={...g.pendingKnock};
   this.state=key;this.since=now;this.nextAction=now+1100;
  }
  const denner=players.find(p=>p.id===g.dennerId);
  const runner=players.find(p=>p.id===g.runnerId);
  const steer=(id:string,v:Vec,sprint:boolean)=>{
   const p=g.member(id),len=Math.hypot(v.x,v.z)||1;
   // Feed the same motion integrator as human inputs; never teleport bots.
   p.lastInputAt=now;
   p.input={seq:++p.lastSeq,dx:v.x/len,dz:v.z/len,sprint};
  };
  if(now>=this.nextMove){
   this.nextMove=now+100;
   if(g.phase==='guessing'&&denner?.bot){
    const target=players.filter(p=>p.id!==denner.id&&p.connected).sort((a,b)=>(this.attempts.get(a.id)||0)-(this.attempts.get(b.id)||0))[0];
    if(target){const v={x:target.position.x-denner.position.x,z:target.position.z-denner.position.z};steer(denner.id,Math.hypot(v.x,v.z)>2.2?v:{x:0,z:0},false)}
   }
   if(g.phase==='chase'&&denner&&runner){
    if(denner.bot&&now>=runner.catchGraceUntil)steer(denner.id,{x:runner.position.x-denner.position.x,z:runner.position.z-denner.position.z},false);
    for(const p of players.filter(p=>p.bot&&p.connected&&p.id!==denner.id&&p.id!==runner.id)){
     const zone=g.safeZones.filter(z=>now<z.expiresAt).sort((a,b)=>
      Math.hypot(p.position.x-a.x,p.position.z-a.z)-Math.hypot(p.position.x-b.x,p.position.z-b.z))[0];
     if(zone){
      const v={x:zone.x-p.position.x,z:zone.z-p.position.z};
      steer(p.id,Math.hypot(v.x,v.z)>zone.radius*.6?v:{x:0,z:0},false);
     }
    }
    if(runner.bot){
     const away={x:runner.position.x-denner.position.x,z:runner.position.z-denner.position.z};
     const len=Math.hypot(away.x,away.z)||1;
     const course={x:away.x/len,z:away.z/len};
     // Follow the edge when the direct escape route would cross the chalk.
     for(const axis of ['x','z'] as const){
      const other=axis==='x'?'z':'x';
      if(Math.abs(runner.position[axis])>ARENA-3 && course[axis]*runner.position[axis]>=0){
       course[axis]=-Math.sign(runner.position[axis])*.35;
       if(Math.abs(course[other])<.3)course[other]=runner.position[other]>0?-1:1;
      }
     }
     if(!course.x&&!course.z)course.x=1;
     steer(runner.id,course,true);
    }
   }
  }
  if(now<this.nextAction)return;
  this.nextAction=now+1300;
  if(g.phase==='category'&&denner?.bot){g.chooseCategory(denner.id,'Cars');return}
  if(g.phase==='identity'&&g.category){
   for(const p of players.filter(p=>p.bot&&p.id!==g.dennerId&&!p.identity)){
    // Try choices through normal validation, just as a player encountering a taken name does.
    const names=[...CATEGORIES[g.category]];
    const offset=players.indexOf(p)%names.length;
    for(let i=0;i<names.length;i++){try{g.chooseIdentity(p.id,names[(i+offset)%names.length]);break}catch{}}
   }
   return;
  }
  if(g.phase==='knock'&&g.pendingKnock&&g.member(g.pendingKnock.targetId).bot){
   const k=g.pendingKnock;g.replyKnock(k.targetId,k.id,['Ask my lawyer.','Catch me first.','You again?'][players.findIndex(p=>p.id===k.targetId)%3]);return;
  }
  if(g.phase==='guessing'&&denner?.bot&&g.category){
   const target=players.filter(p=>p.id!==denner.id&&p.connected).sort((a,b)=>(this.attempts.get(a.id)||0)-(this.attempts.get(b.id)||0))[0];
   if(target&&Math.hypot(target.position.x-denner.position.x,target.position.z-denner.position.z)<=2.5){
    const attempt=this.attempts.get(target.id)||0;this.attempts.set(target.id,attempt+1);
    g.knock(denner.id,target.id,this.known.get(target.id)||CATEGORIES[g.category][attempt%CATEGORIES[g.category].length]);
   }
  }
  if(g.phase==='chase'&&runner?.bot&&now-this.since>6000){
   const names=g.privateFor(runner.id).callNames;
   if(names.length)g.callName(runner.id,names[0]);
  }
 }
}
