import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import type {PublicRoom} from '@chicklets/shared';
import {PhaseChoices} from './PhaseChoices';
import {KnockPlay} from './KnockPlay';
import {RunnerTracker} from './RunnerTracker';

const room:PublicRoom={code:'TEST01',phase:'category',category:'Fruits',players:[],dennerId:'denner',runnerId:'runner',message:'',minPlayers:3,knock:null,speech:null};
const act=async()=>{};

test('Denner sees the current runner and direction throughout the chase',()=>{
 const chase={...room,phase:'chase' as const,players:[{id:'denner',name:'You',position:{x:0,z:0},color:'#123456',ready:true,connected:true,role:'denner' as const,stamina:100},{id:'runner',name:'Chintu',position:{x:10,z:0},color:'#123456',ready:true,connected:true,role:'runner' as const,stamina:100}]};
 const hud=renderToStaticMarkup(<RunnerTracker room={chase} id="denner"/>);
 assert.match(hud,/Chintu/);assert.match(hud,/10m away/);assert.match(hud,/rotate\(90deg\)/);
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
