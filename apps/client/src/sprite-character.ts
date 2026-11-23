import type {Player} from '@chicklets/shared';

export type SpriteCharacter='chintu'|'gudiya'|'bunty'|'tara'|'kabir';
export type SpritePose='idle'|'walk'|'run'|'frozen';
export type SpriteDirection='front'|'frontRight'|'right'|'backRight'|'back'|'backLeft'|'left'|'frontLeft';

const characters:SpriteCharacter[]=['chintu','gudiya','bunty','tara','kabir'];
const rows:Record<SpritePose,number>={idle:0,walk:1,run:2,frozen:3};
const directionColumns:Record<SpriteDirection,number>={front:0,frontRight:0,right:4,backRight:8,back:8,backLeft:8,left:4,frontLeft:0};

export function getSpriteCharacter(player:Pick<Player,'id'|'name'|'bot'|'avatar'>):SpriteCharacter{
 if(player.avatar)return player.avatar;
 if(player.bot){const botName=player.name.toLowerCase();if(characters.includes(botName as SpriteCharacter))return botName as SpriteCharacter}
 let hash=2166136261;
 for(const letter of player.id){hash^=letter.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return characters[(hash>>>0)%characters.length];
}

export function getSpritePose(speed:number,frozen:boolean):SpritePose{
 if(frozen)return 'frozen';
 if(speed>4.8)return 'run';
 if(speed>.14)return 'walk';
 return 'idle';
}

export function getSpriteDirection(dx:number,dz:number,previous:SpriteDirection='front'):SpriteDirection{
 if(Math.hypot(dx,dz)<.08)return previous;
 const horizontal=Math.abs(dx),vertical=Math.abs(dz);
 if(horizontal<=vertical*Math.SQRT2-vertical)return dz>0?'front':'back';
 if(vertical<=horizontal*Math.SQRT2-horizontal)return dx>0?'right':'left';
 return dz>0?(dx>0?'frontRight':'frontLeft'):(dx>0?'backRight':'backLeft');
}

export function getStraightRunFrame(pose:SpritePose,elapsed:number,direction:SpriteDirection){
 if(pose!=='run'||(direction!=='front'&&direction!=='back'))return null;
 return {row:direction==='front'?0:1,column:Math.floor(elapsed*18)%4};
}

export function getSpriteFrame(pose:SpritePose,elapsed:number,direction:SpriteDirection='front'):{row:number;column:number;flipX:boolean}{
 const fps=pose==='run'?18:pose==='walk'?12:pose==='frozen'?6:4;
 return {row:rows[pose],column:directionColumns[direction]+Math.floor(elapsed*fps)%4,flipX:direction.endsWith('Left')||direction==='left'};
}
