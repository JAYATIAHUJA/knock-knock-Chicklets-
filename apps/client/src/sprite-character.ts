import type {Player} from '@chicklets/shared';

export type SpriteCharacter='chintu'|'gudiya'|'bunty';
export type SpritePose='idle'|'walk'|'run'|'frozen';

const characters:SpriteCharacter[]=['chintu','gudiya','bunty'];
const rows:Record<SpritePose,number>={idle:0,walk:1,run:2,frozen:3};

export function getSpriteCharacter(player:Pick<Player,'id'|'name'|'bot'|'avatar'>):SpriteCharacter{
 if(player.avatar)return player.avatar;
 if(player.bot){const botName=player.name.toLowerCase();if(botName==='chintu'||botName==='gudiya'||botName==='bunty')return botName}
 let hash=2166136261;
 for(const letter of player.id){hash^=letter.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return characters[(hash>>>0)%characters.length];
}

export function getSpritePose(speed:number,frozen:boolean):SpritePose{
 if(frozen)return 'frozen';
 if(speed>4.2)return 'run';
 if(speed>.14)return 'walk';
 return 'idle';
}

export function getSpriteFrame(pose:SpritePose,elapsed:number):{row:number;column:number}{
 const fps=pose==='run'?11:pose==='walk'?8:pose==='frozen'?5:3;
 return {row:rows[pose],column:Math.floor(elapsed*fps)%4};
}
