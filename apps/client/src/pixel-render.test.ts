import test from 'node:test';
import assert from 'node:assert/strict';
import {getPixelDpr,getPixelRenderSize,getTextureFilterMode,PIXEL_SCALE} from './pixel-render.ts';

test('pixel render size is integer, capped and keeps a useful mobile minimum',()=>{
 assert.equal(PIXEL_SCALE,3);
 assert.deepEqual(getPixelRenderSize(1280,720,2),{width:640,height:360});
 assert.deepEqual(getPixelRenderSize(360,640,3),{width:180,height:320});
 const odd=getPixelRenderSize(997,613,1.25);
 assert.ok(Number.isInteger(odd.width)&&Number.isInteger(odd.height));
 assert.ok(odd.width>=160&&odd.height>=90);
});

test('runtime DPR follows the tested pixel scale policy',()=>{
 assert.equal(getPixelDpr(1),1/3);
 assert.equal(getPixelDpr(2),.5);
 assert.equal(getPixelDpr(4),.5);
});

test('only colour maps use hard nearest filtering',()=>{
 assert.equal(getTextureFilterMode(0),'pixel');
 assert.equal(getTextureFilterMode(1),'smooth');
 assert.equal(getTextureFilterMode(2),'smooth');
});
