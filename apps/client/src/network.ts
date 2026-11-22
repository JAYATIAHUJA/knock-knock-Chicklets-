import type {PrivateState,PublicRoom} from '@chicklets/shared';
import {io} from 'socket.io-client';import {useGame} from './store';
type Session={code:string;token:string;playerId:string};const KEY='chicklets-session';
export const socket=io(import.meta.env.VITE_SERVER_URL||`${location.protocol}//${location.hostname}:3001`,{autoConnect:true});
socket.on('room',(room:PublicRoom)=>useGame.getState().setRoom(room));socket.on('private',(data:PrivateState)=>{useGame.getState().setIdentity(data.identity);useGame.getState().setCallNames(data.callNames)});
socket.on('connect',async()=>{const saved=sessionStorage.getItem(KEY);if(!saved)return;try{const session=JSON.parse(saved) as Session;const resumed=await send('resume',session.token) as Session;useGame.getState().setPlayerId(resumed.playerId);useGame.getState().setError('')}catch{sessionStorage.removeItem(KEY);useGame.getState().setRoom(null);useGame.getState().setPlayerId('');useGame.getState().setIdentity(null);useGame.getState().setCallNames([]);useGame.getState().setError('Your old session expired. Join a room again.')}});
export function saveSession(session:Session){sessionStorage.setItem(KEY,JSON.stringify(session));useGame.getState().setPlayerId(session.playerId)}
export function send<T>(event:string,value:T):Promise<unknown>{return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server did not respond')),5000);socket.emit(event,value,(result:{ok:boolean;data?:unknown;error?:string})=>{clearTimeout(timeout);result.ok?resolve(result.data):reject(Error(result.error))})})}
