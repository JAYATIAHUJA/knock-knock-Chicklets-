import test from 'node:test';
import assert from 'node:assert/strict';
import {getVoxelVariant} from './voxel-character.ts';

test('voxel variants are deterministic and visibly diverse',()=>{
 assert.deepEqual(getVoxelVariant('player-a'),getVoxelVariant('player-a'));
 const variants=['player-a','player-b','player-c','player-d','player-e','player-f'].map(getVoxelVariant);
 assert.ok(new Set(variants.map(v=>v.hair)).size>=3);
 assert.ok(new Set(variants.map(v=>v.outfit)).size>=3);
 assert.ok(variants.every(v=>/^#[0-9a-f]{6}$/i.test(v.skin)));
});
