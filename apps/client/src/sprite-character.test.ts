import test from 'node:test';
import assert from 'node:assert/strict';
import {getSpriteCharacter,getSpriteDirection,getSpriteFrame,getSpritePose,getStraightRunFrame} from './sprite-character.ts';

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
 assert.deepEqual(getSpriteFrame('frozen',0),{row:3,column:0,flipX:false});
 assert.deepEqual(getSpriteFrame('run',4/18),{row:2,column:0,flipX:false});
});

test('travel direction selects front, back and mirrored side frames',()=>{
 assert.equal(getSpriteDirection(1,0),'right');
 assert.equal(getSpriteDirection(-1,0),'left');
 assert.equal(getSpriteDirection(0,-1),'back');
 assert.equal(getSpriteDirection(0,1),'front');
 assert.equal(getSpriteDirection(0,0,'back'),'back');
 assert.deepEqual(getSpriteFrame('walk',0,'left'),{row:1,column:4,flipX:true});
 assert.deepEqual(getSpriteFrame('walk',0,'right'),{row:1,column:4,flipX:false});
 assert.deepEqual(getSpriteFrame('run',0,'back'),{row:2,column:8,flipX:false});
});

test('straight running uses true front and back views while diagonals keep angled frames',()=>{
 assert.equal(getSpriteDirection(.2,1),'front');
 assert.equal(getSpriteDirection(-.2,-1),'back');
 assert.equal(getSpriteDirection(1,1),'frontRight');
 assert.equal(getSpriteDirection(-1,1),'frontLeft');
 assert.equal(getSpriteDirection(1,-1),'backRight');
 assert.deepEqual(getStraightRunFrame('run',0,'front'),{row:0,column:0});
 assert.deepEqual(getStraightRunFrame('run',1/18,'back'),{row:1,column:1});
 assert.equal(getStraightRunFrame('walk',0,'front'),null);
 assert.equal(getStraightRunFrame('run',0,'frontRight'),null);
 assert.deepEqual(getSpriteFrame('run',0,'frontLeft'),{row:2,column:0,flipX:true});
});
