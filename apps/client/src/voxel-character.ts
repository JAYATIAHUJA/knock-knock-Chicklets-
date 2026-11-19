export type VoxelVariant={hair:0|1|2|3;outfit:0|1|2;skin:string;trouser:string;accent:string};
const skins=['#8f5f43','#a96f4d','#bc825d','#754a35'] as const;
const trousers=['#273949','#46382e','#324638','#493b59'] as const;
const accents=['#f0b43c','#e56f45','#63a47c','#718fc4'] as const;

function hash(value:string){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function getVoxelVariant(playerId:string):VoxelVariant{
 const h=hash(playerId);
 return {hair:(h%4) as VoxelVariant['hair'],outfit:(Math.floor(h/7)%3) as VoxelVariant['outfit'],skin:skins[Math.floor(h/13)%skins.length],trouser:trousers[Math.floor(h/19)%trousers.length],accent:accents[Math.floor(h/23)%accents.length]};
}
