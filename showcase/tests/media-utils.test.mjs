import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probeDuration} from '../media-utils.mjs';

function fakeMedia() {
  return {
    preload: '',src:'',duration:NaN,onloadedmetadata:null,onerror:null,loadCount:0,
    removeAttribute(name){assert.equal(name,'src');this.src='';},
    load(){this.loadCount++;}
  };
}

test('reads a finite source duration and releases temporary metadata element',async()=>{
  const el=fakeMedia();
  const p=probeDuration({name:'source.mp4'},'blob:local','video',{createElement:kind=>{
    assert.equal(kind,'video');return el;
  }});
  el.duration=13.75;el.onloadedmetadata();
  assert.equal(await p,13.75);
  assert.equal(el.src,'');
  assert.equal(el.loadCount,1);
  assert.equal(el.onloadedmetadata,null);
  assert.equal(el.onerror,null);
});

test('rejects unbounded duration instead of exporting impossible clip',async()=>{
  const el=fakeMedia(),p=probeDuration({name:'live.webm'},'blob:local','video',{createElement:()=>el});
  el.duration=Infinity;el.onloadedmetadata();
  await assert.rejects(p,/Unable to determine duration/);
  assert.equal(el.src,'');
});

test('settles exactly once when load fails and discards event handlers',async()=>{
  const el=fakeMedia(),p=probeDuration({name:'broken.mkv'},'blob:local','video',{createElement:()=>el});
  const onError=el.onerror;
  onError();
  onError(); // Late browser event should not trigger another cleanup.
  await assert.rejects(p,/cannot inspect broken.mkv/);
  assert.equal(el.loadCount,1);
  assert.equal(el.onerror,null);
});

test('audio sources use audio metadata only',async()=>{
  const el=fakeMedia(),p=probeDuration({name:'song.wav'},'blob:local','audio',{createElement:kind=>{
    assert.equal(kind,'audio');return el;
  }});
  el.duration=5;el.onloadedmetadata();
  assert.equal(await p,5);
});
