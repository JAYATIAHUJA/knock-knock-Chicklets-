import type {PrivateState,PublicRoom} from '@chicklets/shared';
import {syncServerClock} from './serverClock';
import {io} from 'socket.io-client';import {useGame} from './store';
type Session={code:string;token:string;playerId:string};const KEY='chicklets-session';
export const socket=io(import.meta.env.VITE_SERVER_URL||`${location.protocol}//${location.hostname}:3001`,{autoConnect:true});
socket.on('room',(room:PublicRoom)=>{syncServerClock(room.serverTime);useGame.getState().setRoom(room)});socket.on('private',(data:PrivateState)=>{useGame.getState().setIdentity(data.identity);useGame.getState().setCallNames(data.callNames)});
socket.on('connect',async()=>{const saved=sessionStorage.getItem(KEY);if(!saved)return;try{const session=JSON.parse(saved) as Session;const resumed=await send('resume',session.token) as Session;useGame.getState().setPlayerId(resumed.playerId);useGame.getState().setError('')}catch{sessionStorage.removeItem(KEY);useGame.getState().setRoom(null);useGame.getState().setPlayerId('');useGame.getState().setIdentity(null);useGame.getState().setCallNames([]);useGame.getState().setError('Your old session expired. Join a room again.')}});
export function saveSession(session:Session){sessionStorage.setItem(KEY,JSON.stringify(session));useGame.getState().setPlayerId(session.playerId)}
function waitForConnection():Promise<void>{
 if(socket.connected)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timeout);socket.off('connect',connected);socket.off('connect_error',failed)};
  const connected=()=>{cleanup();resolve()};
  const failed=()=>{cleanup();reject(Error('Could not connect to the game server. Check your connection and try again.'))};
  const timeout=setTimeout(failed,5000);
  socket.once('connect',connected);
  socket.once('connect_error',failed);
  socket.connect();
 });
}
export async function send<T>(event:string,value:T):Promise<unknown>{
 await waitForConnection();
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('The game server did not answer. Please try again.')),5000);
  socket.emit(event,value,(result:{ok:boolean;data?:unknown;error?:string})=>{
   clearTimeout(timeout);
   result?.ok?resolve(result.data):reject(Error(result?.error??'The game server could not complete that action.'));
  });
 });
}
