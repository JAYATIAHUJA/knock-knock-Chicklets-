import test from 'node:test';
import assert from 'node:assert/strict';
import {getSpriteCharacter,getSpriteFrame,getSpritePose} from './sprite-character.ts';

test('computer friends keep their named appearance',()=>{
 for(const name of ['Chintu','Gudiya','Bunty'] as const)
  assert.equal(getSpriteCharacter({id:`bot-${name}`,name,bot:true}),name.toLowerCase());
 assert.equal(getSpriteCharacter({id:'human-1',name:'My name'}),getSpriteCharacter({id:'human-1',name:'Renamed'}));
 assert.equal(getSpriteCharacter({id:'human-1',name:'My name',avatar:'gudiya'}),'gudiya');
});

test('movement and freeze choose the visible animation row',()=>{
 assert.equal(getSpritePose(8,true),'frozen');
 assert.equal(getSpritePose(6,false),'run');
 assert.equal(getSpritePose(2,false),'walk');
 assert.equal(getSpritePose(0,false),'idle');
 assert.deepEqual(getSpriteFrame('frozen',0),{row:3,column:0});
 assert.deepEqual(getSpriteFrame('run',4/11),{row:2,column:0});
});
