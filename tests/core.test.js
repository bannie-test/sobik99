import test from 'node:test';
import assert from 'node:assert/strict';
import {cubeTimeline} from '../src/components/cube-engine.js';
import {averageOf,formatTime,effective,statistics} from '../src/utils/stats.js';
import {read,write,validHistory} from '../src/utils/storage.js';
const solve=(ms,penalty='none')=>({ms,penalty});
test('20 inverse turns restore every cubie position and orientation',()=>{const t=cubeTimeline();assert.notDeepEqual(t.states[0],t.solved);const final=t.sample(20);final.forEach((c,i)=>{assert.deepEqual(c.p.map(x=>x||0),t.solved[i].p);assert.deepEqual(c.m.map(x=>x||0),t.solved[i].m)});for(const state of t.states)assert.equal(new Set(state.map(c=>c.p.join(','))).size,26);});
test('trimmed averages handle penalties, DNF and insufficient solves',()=>{assert.equal(averageOf([10,11,12,13,14].map(x=>solve(x*1000)),5),12000);assert.equal(averageOf([solve(10000),solve(11000),solve(12000),solve(13000),solve(1,'DNF')],5),12000);assert.equal(averageOf([solve(1,'DNF'),solve(2,'DNF'),solve(3),solve(4),solve(5)],5),Infinity);assert.equal(averageOf([],12),null);assert.equal(effective(solve(1000,'+2')),3000);assert.equal(formatTime(61239),'01:01.23');assert.equal(statistics([]).best,null)});
test('storage survives corrupted and unavailable storage',()=>{globalThis.localStorage={getItem:()=>'{bad',setItem:()=>{throw Error('quota')}};assert.deepEqual(read('x',[]),[]);assert.equal(write('x',[]),false);assert.equal(validHistory([{ms:-1}]),false);delete globalThis.localStorage;assert.deepEqual(read('x',[]),[])});
