export const PIXEL_SCALE=3;
export const getPixelDpr=(deviceDpr:number)=>Math.min(Math.max(deviceDpr,1),1.5)/PIXEL_SCALE;
export const getTextureFilterMode=(mapIndex:number):'pixel'|'smooth'=>mapIndex===0?'pixel':'smooth';

export function getPixelRenderSize(width:number,height:number,dpr:number){
 const effectiveDpr=Math.min(Math.max(dpr,1),1.5);
 return {
  width:Math.max(160,Math.floor(width*effectiveDpr/PIXEL_SCALE)),
  height:Math.max(90,Math.floor(height*effectiveDpr/PIXEL_SCALE))
 };
}
