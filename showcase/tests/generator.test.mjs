import { test } from 'node:test';
import assert from 'node:assert/strict';
import {buildFFmpeg,buildPipeline,shellQuote} from '../generator.mjs';
const sample=()=>({videos:[{name:'first clip.mp4',start:2,end:10,duration:12}],audio:null,width:1280,height:720,fps:30,output:'edited.mp4'});
test('single clip generates safe FFmpeg command and valid mapping',()=>{
 const c=buildFFmpeg(sample());
 assert.match(c.command,/-ss 2 -t 8 -i '\.\/first clip\.mp4'/);
 assert.match(c.command,/-map 0:a\?/);
 assert.match(c.command,/libx264/);
 assert.equal(c.duration,8);
});
test('shell quoting escapes apostrophes',()=>assert.equal(shellQuote("that's fine"),"'that'\\''s fine'"));
test('multi-clip concat does not claim to preserve source audio',()=>{
 const p=sample();p.videos.push({name:'next.mp4',start:0,end:5,duration:7});
 const c=buildFFmpeg(p);assert.match(c.command,/concat=n=2:v=1:a=0/);assert.match(c.warning,/without their original audio/);
 assert.throws(()=>buildPipeline(p),/one video input/);
});
test('external audio uses volume, delay and padding',()=>{
 const p=sample();p.audio={name:'track.wav',start:1,end:7,duration:10,offset:1,volume:0.5};
 const c=buildFFmpeg(p);assert.match(c.command,/adelay=1000:all=1/);assert.match(c.command,/volume=0.5/);
 assert.match(c.command,/apad=whole_dur=8/);
});
test('toolkit pipeline emits actual trim and resize schema',()=>{
 const c=buildPipeline(sample());assert.match(c.command,/version: 1/);assert.match(c.command,/  - trim:/);assert.match(c.command,/  - resize:/);assert.match(c.command,/  - convert:/);assert.match(c.command,/  codec: h264/);
});
test('refuses unsafe filenames, overwrites and invalid dimensions',()=>{
 let p=sample();p.output='first clip.mp4';assert.throws(()=>buildFFmpeg(p),/Output must be a safe|overwrite/);
 p=sample();p.videos[0].name='../../secret.mp4';assert.throws(()=>buildFFmpeg(p),/filename relative/);
 p=sample();p.width=1279;assert.throws(()=>buildFFmpeg(p),/dimensions/);
});
