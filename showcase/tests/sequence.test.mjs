import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sequenceDuration,locateSequenceTime,soundtrackTimeAt} from '../sequence.mjs';

const videos=[
  {id:1,start:2,end:6,name:'first.mp4'},
  {id:2,start:1,end:4,name:'second.mp4'},
  {id:3,start:0,end:2,name:'third.mp4'},
];

test('video timeline length is sum of edited, not original, durations',()=>{
  assert.equal(sequenceDuration(videos),9);
  assert.equal(sequenceDuration([]),0);
});

test('sequence lookup maps global time to trimmed media source time',()=>{
  const loc=locateSequenceTime(videos,2.5);
  assert.equal(loc.index,0);
  assert.equal(loc.sequenceStart,0);
  assert.equal(loc.sourceTime,4.5);
});

test('exact boundary chooses the next clip at its trimmed in point',()=>{
  const loc=locateSequenceTime(videos,4);
  assert.equal(loc.index,1);
  assert.equal(loc.sequenceStart,4);
  assert.equal(loc.sourceTime,1);
});

test('end clamps to last source out point without wrap',()=>{
  const loc=locateSequenceTime(videos,25);
  assert.equal(loc.index,2);
  assert.equal(loc.position,9);
  assert.equal(loc.sourceTime,2);
  assert.equal(loc.atEnd,true);
});

test('negative and invalid times are handled without out-of-bounds seek',()=>{
  assert.equal(locateSequenceTime(videos,-3).sourceTime,2);
  assert.equal(locateSequenceTime(videos,NaN),null);
  assert.equal(locateSequenceTime([],2),null);
});

test('soundtrack respects offset, in/out trims and silence before and after',()=>{
  const audio={start:3,end:7,offset:1.5};
  assert.equal(soundtrackTimeAt(audio,0),null);
  assert.equal(soundtrackTimeAt(audio,1.5),3);
  assert.equal(soundtrackTimeAt(audio,4),5.5);
  assert.equal(soundtrackTimeAt(audio,5.5),null);
  assert.equal(soundtrackTimeAt(null,2),null);
});
