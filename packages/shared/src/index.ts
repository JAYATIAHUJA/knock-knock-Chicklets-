export const CATEGORIES = { Cars: ['Maruti','BMW','Ambassador','Fiat','Tata','Honda','Toyota','Mahindra'], Fruits: ['Mango','Guava','Banana','Jamun','Papaya','Pomegranate','Coconut','Litchi'], Animals: ['Tiger','Elephant','Peacock','Monkey','Parrot','Camel','Goat','Rabbit'], Things: ['Kite','Marble','Top','Lantern','Bicycle','Drum','Book','Ball'] } as const;
export type Category = keyof typeof CATEGORIES;
export type Phase = 'lobby'|'category'|'identity'|'guessing'|'knock'|'chase'|'caught';
export type Vec = {x:number;z:number};
export type Input = {seq:number;dx:number;dz:number;sprint:boolean};
export type Player = {bot?:boolean;id:string;name:string;color:string;ready:boolean;position:Vec;role:'denner'|'runner'|'other';connected:boolean};
export type Knock = {id:string;dennerId:string;targetId:string;name:string;expiresAt:number};
export type Speech = {playerId:string;text:string;expiresAt:number};
export type PublicRoom = {code:string;phase:Phase;category:Category|null;players:Player[];dennerId:string|null;runnerId:string|null;message:string;minPlayers:number;knock:Knock|null;speech:Speech|null};
export const ARENA = 20, SPEED = 4.5, SPRINT = 1.65, TICK = 1/60, CATCH_RADIUS = 1.15;
export function canMove(phase:Phase,id:string,dennerId:string|null,runnerId:string|null){return phase==='category'||phase==='guessing'?id===dennerId:phase==='chase'?(id===dennerId||id===runnerId):false}
export function move(pos:Vec,input:Input,dt=TICK){const len=Math.hypot(input.dx,input.dz);const scale=len>1?1/len:1;const speed=SPEED*(input.sprint?SPRINT:1);return {x:pos.x+input.dx*scale*speed*dt,z:pos.z+input.dz*scale*speed*dt}}
export function stepMotion(pos:Vec,velocity:Vec,input:Input,dt=TICK){const len=Math.hypot(input.dx,input.dz);const scale=len>1?1/len:1;const top=SPEED*(input.sprint?SPRINT:1);const target={x:input.dx*scale*top,z:input.dz*scale*top};const response=len>0?17:22;const blend=1-Math.exp(-response*dt);const nextVelocity={x:velocity.x+(target.x-velocity.x)*blend,z:velocity.z+(target.z-velocity.z)*blend};return {position:{x:pos.x+nextVelocity.x*dt,z:pos.z+nextVelocity.z*dt},velocity:nextVelocity}}
export function outside(pos:Vec){return Math.abs(pos.x)>ARENA||Math.abs(pos.z)>ARENA}
export function caught(a:Vec,b:Vec){return Math.hypot(a.x-b.x,a.z-b.z)<CATCH_RADIUS}
export function chooseDenner(ids:string[],random=Math.random){if(!ids.length)throw Error('No players');return ids[Math.floor(random()*ids.length)]}
