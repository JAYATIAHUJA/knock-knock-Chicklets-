import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import type {PublicRoom} from '@chicklets/shared';
import {PhaseChoices} from './PhaseChoices';
import {KnockPlay} from './KnockPlay';
import {RunnerTracker} from './RunnerTracker';
import {LobbyStage} from './LobbyStage';

const room:PublicRoom={code:'TEST01',phase:'category',category:'Fruits',players:[],dennerId:'denner',runnerId:'runner',message:'',minPlayers:3,knock:null,speech:null};
const act=async()=>{};

test('lobby readiness and roster appear together in the central choice stage',()=>{
 const lobby={...room,phase:'lobby' as const,players:[{id:'denner',name:'You',position:{x:0,z:0},color:'#123456',ready:false,connected:true,role:'other' as const,stamina:100}]};
 const html=renderToStaticMarkup(<LobbyStage room={lobby} id="denner" onReady={()=>{}}/>);
 assert.match(html,/phase-choice-stage lobby-stage/);assert.match(html,/Gather the gang/);assert.match(html,/I’M READY/);assert.match(html,/You \(you\)/);
});

test('chase map shows both players at their server positions',()=>{
 const chase={...room,phase:'chase' as const,players:[{id:'denner',name:'You',position:{x:0,z:0},color:'#123456',ready:true,connected:true,role:'denner' as const,stamina:100},{id:'runner',name:'Chintu',position:{x:10,z:0},color:'#123456',ready:true,connected:true,role:'runner' as const,stamina:100}]};
 const hud=renderToStaticMarkup(<RunnerTracker room={chase} id="denner"/>);
 assert.match(hud,/COURTYARD MAP/);assert.match(hud,/Chintu/);assert.match(hud,/cx="100" cy="100"/);assert.match(hud,/cx="147" cy="100"/);
 assert.doesNotMatch(hud,/runner-arrow|m away/);
 assert.equal(renderToStaticMarkup(<RunnerTracker room={chase} id="runner"/>),'');
});

test('category and identity choices occupy one contextual surface',()=>{
 const category=renderToStaticMarkup(<PhaseChoices room={room} id="denner" identity={null} act={act}/>);
 assert.match(category,/Choose a category/);assert.equal((category.match(/<button/g)||[]).length,4);
 const waiting=renderToStaticMarkup(<PhaseChoices room={room} id="runner" identity={null} act={act}/>);
 assert.doesNotMatch(waiting,/<button/);
 const identity=renderToStaticMarkup(<PhaseChoices room={{...room,phase:'identity'}} id="runner" identity={null} act={act}/>);
 assert.match(identity,/Mango/);assert.equal((identity.match(/<button/g)||[]).length,8);
 const chosen=renderToStaticMarkup(<PhaseChoices room={{...room,phase:'identity'}} id="runner" identity="Mango" act={act}/>);
 assert.match(chosen,/Mango/);assert.doesNotMatch(chosen,/<button|Guava/);
 assert.equal(renderToStaticMarkup(<PhaseChoices room={{...room,phase:'chase'}} id="runner" identity="Mango" act={act}/>),'');
});

test('runner sees only server-provided relay buttons and observers see none',()=>{
 const chase={...room,phase:'chase' as const,relayDeadline:Date.now()+20000,chaseStartsAt:Date.now()+3500};
 const panel=renderToStaticMarkup(<KnockPlay room={chase} id="runner" callNames={['Guava']} act={act}/>);
 assert.match(panel,/Guava!/);assert.doesNotMatch(panel,/Banana|Mango/);assert.equal((panel.match(/<button/g)||[]).length,1);
 assert.match(panel,/Denner is waiting/);
 assert.equal(renderToStaticMarkup(<KnockPlay room={chase} id="denner" callNames={[]} act={act}/>),'');
 const unavailable=renderToStaticMarkup(<KnockPlay room={chase} id="runner" callNames={[]} act={act}/>);
 assert.doesNotMatch(unavailable,/<button/);assert.match(unavailable,/No connected player/);
});
