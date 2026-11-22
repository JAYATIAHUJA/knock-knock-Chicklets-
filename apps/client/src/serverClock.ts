let offset=0;
export function syncServerClock(serverTime:number|undefined,receivedAt=Date.now()){
 if(typeof serverTime==='number'&&Number.isFinite(serverTime))offset=serverTime-receivedAt;
}
export function serverNow(){return Date.now()+offset}
