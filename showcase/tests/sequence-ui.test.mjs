import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('../index.html');
const app=read('../app.mjs');
const css=read('../style.css');
const workflow=read('../../.github/workflows/publish-showcase.yml');

test('sequence preview controls are real, accessible, and wired to playback',()=>{
  for(const id of ['sequence-play','sequence-scrub','sequence-time','sequence-context']){
    assert.ok(html.includes('id="'+id+'"'),'Missing sequence control '+id);
  }
  assert.match(html,/aria-label="Local sequence preview"/);
  assert.match(app,/function seekSequence\(/);
  assert.match(app,/function advanceSequence\(/);
  assert.match(app,/video\.addEventListener\('ended',advanceSequence\)/);
  assert.match(app,/locateSequenceTime\(project\.videos/);
});

test('scrub captures input value before the transport repaints it',()=>{
  assert.match(app,/const requested=Number\(event\.target\.value\);\s*pauseSequence\(\);\s*seekSequence\(requested\);/);
});

test('soundtrack preview remains local and follows its independent offset',()=>{
  assert.match(app,/soundtrackTimeAt\(audio,sequencePosition\)/);
  assert.match(app,/video\.muted=Boolean\(project\.audio\)\|\|project\.videos\.length>1/);
  assert.match(app,/soundtrackPreview\.pause\(\)/);
  assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon\s*\(/);
});

test('responsive transport is styled for narrow screens',()=>{
  assert.match(css,/\.sequence-controls\{/);
  assert.match(css,/@media\(max-width:640px\)/);
});

test('manual Pages publishing verifies and stages sequence helper',()=>{
  assert.match(workflow,/node --check showcase\/sequence\.mjs/);
  assert.match(workflow,/cp showcase\/index\.html.*showcase\/sequence\.mjs/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^\s*push:/m);
});
