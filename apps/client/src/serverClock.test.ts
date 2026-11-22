import test from 'node:test';
import assert from 'node:assert/strict';
import {serverNow,syncServerClock} from './serverClock';

test('countdowns use server time even when the browser clock differs',()=>{
 const browser=Date.now();
 syncServerClock(browser-5000,browser);
 assert.ok(Math.abs(serverNow()-(Date.now()-5000))<10);
 syncServerClock(browser,browser);
});
