import {buildFFmpeg,buildPipeline,buildScript,pathForShell} from './generator.mjs';
import {probeDuration} from './media-utils.mjs';

const $=id=>document.getElementById(id);
const project={videos:[],audio:null,width:1280,height:720,fps:30,output:'edited.mp4'};
let selected=null,mode='ffmpeg',currentPreview=null,lastCode='',lastError='',sequence=0;
const assetTypes={video:/\.(mp4|m4v|mov|mkv|webm|avi)$/i,audio:/\.(wav|mp3|m4a|flac|ogg|opus|aac)$/i};
const fmt=seconds=>{seconds=Math.max(0,Number(seconds)||0);const min=Math.floor(seconds/60);const sec=Math.floor(seconds%60);return String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')};
function tell(message){const el=$('messages');el.textContent=message;el.hidden=!message;}
function allClips(){return [...project.videos,...(project.audio?[project.audio]:[])];}
function duration(){return project.videos.reduce((sum,v)=>sum+Math.max(0,v.end-v.start),0);}
function makeNode(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
function typeOf(file){if(file.type.startsWith('video/')||assetTypes.video.test(file.name))return 'video';if(file.type.startsWith('audio/')||assetTypes.audio.test(file.name))return 'audio';return null;}
async function loadFiles(files){
 const warnings=[],added=[];
 for(const file of files){
  const kind=typeOf(file);
  if(!kind){warnings.push('Skipped unsupported media: '+file.name);continue;}
  if(allClips().some(v=>v.name===file.name)){warnings.push('Duplicate filename skipped: '+file.name);continue;}
  try{pathForShell(file.name)}catch{warnings.push('Unsafe filename skipped: '+file.name);continue;}
  if(kind==='video'&&project.videos.length>=8){warnings.push('Only eight video clips are supported in this demonstration.');continue;}
  const url=URL.createObjectURL(file);
  try{
   const d=await probeDuration(file,url,kind);
   const item={id:++sequence,kind,name:file.name,file,url,duration:d,start:0,end:d,offset:0,volume:1,waveform:null};
   if(kind==='audio'){
    if(project.audio){URL.revokeObjectURL(project.audio.url);if(selected===project.audio)selected=null;}
    project.audio=item;
    void extractWaveform(item);
   }else project.videos.push(item);
   added.push(file.name);selected=item;
  }catch(e){URL.revokeObjectURL(url);warnings.push(e.message)}
 }
 if(added.length)tell('Imported '+added.length+' local file(s). '+warnings.join(' '));else tell(warnings.join(' ')||'No supported files selected.');
 render();
}
async function extractWaveform(clip){
 if(clip.file.size>24*1024*1024)return;
 let ctx;
 try{
  const buffer=await clip.file.arrayBuffer();
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  const decoded=await ctx.decodeAudioData(buffer);
  const data=decoded.getChannelData(0),values=[],n=160,block=Math.max(1,Math.floor(data.length/n));
  for(let i=0;i<n;i++){let peak=0;for(let j=i*block;j<Math.min(data.length,(i+1)*block);j+=Math.max(1,Math.floor(block/80)))peak=Math.max(peak,Math.abs(data[j]));values.push(peak)}
  if(project.audio===clip){clip.waveform=values;renderTimeline();}
 }catch{ /* The local source may not be decodable by Web Audio. Preview still works when supported. */ }
 finally{if(ctx)void ctx.close()}
}
function renderAssets(){
 const list=$('asset-list');list.replaceChildren();
 $('asset-count').textContent=allClips().length+' FILES';
 for(const clip of allClips()){
  const b=makeNode('button','asset'+(clip.kind==='audio'?' audio':''));b.type='button';
  b.setAttribute('aria-pressed',String(clip===selected));
  const icon=makeNode('span','asset-icon',clip.kind==='video'?'▣':'♫');
  const body=makeNode('span','file-info');body.append(makeNode('strong','',clip.name),makeNode('small','Duration '+fmt(clip.duration)+' · '+clip.kind));
  b.append(icon,body);b.addEventListener('click',()=>{selected=clip;render()});list.append(b);
 }
}
function waveform(canvas,clip){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#faafbd';const values=clip.waveform;
 if(!values?.length)return;
 for(let i=0;i<values.length;i++){const x=i*w/values.length,amp=Math.max(.06,values[i])*h*.88;ctx.fillRect(x,(h-amp)/2,Math.max(1,w/values.length-1),amp)}
}
function renderTimeline(){
 const video=$('video-track'),audio=$('audio-track');video.replaceChildren();audio.replaceChildren();
 const total=Math.max(duration(),1);
 $('duration').textContent=fmt(duration())+' TOTAL';
 for(const clip of project.videos){
  const button=makeNode('button','segment');button.type='button';button.style.flex=String(Math.max(.5,clip.end-clip.start));
  button.setAttribute('aria-pressed',String(clip===selected));
  button.append(makeNode('span','',clip.name),makeNode('small','IN '+fmt(clip.start)+' · '+fmt(clip.end)));
  button.title=clip.name+' ('+(clip.end-clip.start).toFixed(1)+' seconds)';
  button.addEventListener('click',()=>{selected=clip;render()});video.append(button);
 }
 if(!project.videos.length)video.append(makeNode('span','track-placeholder','Add a video to build a sequence'));
 if(project.audio){
  const clip=project.audio,offset=Math.min(100,100*clip.offset/total),width=Math.max(3,Math.min(100-offset,100*(clip.end-clip.start)/total));
  const button=makeNode('button','segment audio');button.type='button';button.style.marginLeft=offset+'%';button.style.width=width+'%';
  button.setAttribute('aria-pressed',String(clip===selected));
  if(clip.waveform?.length){const canvas=makeNode('canvas','waveform');canvas.width=320;canvas.height=64;canvas.setAttribute('aria-hidden','true');button.append(canvas);waveform(canvas,clip);}
  button.append(makeNode('span','',clip.name),makeNode('small','+'+clip.offset.toFixed(1)+'s · '+fmt(clip.end-clip.start)));
  button.addEventListener('click',()=>{selected=clip;render()});audio.append(button);
 }else audio.append(makeNode('span','track-placeholder','Add one audio file to replace the soundtrack'));
}
function renderProperties(){
 $('clip-fields').hidden=!selected;$('no-selection').hidden=!!selected;
 if(!selected)return;
 $('selected-name').textContent=selected.name;
 $('clip-in').value=Number(selected.start.toFixed(2));
 $('clip-out').value=Number(selected.end.toFixed(2));
 for(const id of ['clip-in','clip-out'])$(id).max=String(selected.duration);
 $('clip-range').textContent='Selected '+(selected.end-selected.start).toFixed(2)+' s / source '+selected.duration.toFixed(2)+' s';
 $('audio-fields').hidden=selected.kind!=='audio';
 $('video-order').hidden=selected.kind!=='video';
 if(selected.kind==='audio'){
  $('audio-offset').value=String(selected.offset);$('audio-volume').value=String(Math.round(selected.volume*100));
  $('gain-value').textContent=Math.round(selected.volume*100)+'%';
 }else{
  const idx=project.videos.indexOf(selected);
  $('move-left').disabled=idx<=0;$('move-right').disabled=idx>=project.videos.length-1;
 }
}
const audioPreview=makeNode('audio');audioPreview.controls=true;audioPreview.preload='metadata';
$('video-preview').parentElement.append(audioPreview);
const video=$('video-preview');
function renderPreview(){
 const p=selected;
 if(!p){video.hidden=true;audioPreview.hidden=true;$('preview-empty').hidden=false;$('preview-kind').textContent='NO SOURCE';$('preview-name').textContent='No clip selected';$('preview-time').textContent='00:00 / 00:00';$('scrub').disabled=true;return;}
 const target=p.kind==='video'?video:audioPreview,other=p.kind==='video'?audioPreview:video;
 if(currentPreview!==p){other.pause();target.pause();other.hidden=true;target.src=p.url;target.load();currentPreview=p;target.addEventListener('loadedmetadata',()=>{if(currentPreview===p)target.currentTime=p.start},{once:true});}
 target.hidden=false;other.hidden=true;$('preview-empty').hidden=true;
 if(p.kind==='audio')audioPreview.volume=Math.min(1,Math.max(0,p.volume));
 $('preview-kind').textContent=p.kind.toUpperCase()+' / LOCAL';$('preview-name').textContent=p.name;
 const scrub=$('scrub');scrub.disabled=false;scrub.min=String(p.start);scrub.max=String(p.end);scrub.value=String(Math.max(p.start,Math.min(p.end,target.currentTime||p.start)));
 $('preview-time').textContent=fmt(target.currentTime||p.start)+' / '+fmt(p.end);
}
for(const target of [video,audioPreview])target.addEventListener('timeupdate',()=>{
 if(!selected||currentPreview!==selected||target.hidden)return;
 if(target.currentTime>selected.end+.05)target.pause();
 $('scrub').value=String(Math.min(selected.end,Math.max(selected.start,target.currentTime)));
 $('preview-time').textContent=fmt(target.currentTime)+' / '+fmt(selected.end);
});
$('scrub').addEventListener('input',event=>{
 const target=selected?.kind==='video'?video:audioPreview;
 if(selected&&currentPreview===selected)target.currentTime=Number(event.target.value);
});
function dataForExport(){return {videos:project.videos.map(({name,start,end,duration})=>({name,start,end,duration})),audio:project.audio?((({name,start,end,duration,offset,volume})=>({name,start,end,duration,offset,volume}))(project.audio)):null,width:project.width,height:project.height,fps:project.fps,output:project.output}}
function renderCode(){
 const label={ffmpeg:'BASH / FFMPEG',bash:'SHELL / BASH',yaml:'YAML / TOOLKIT V1'};
 $('code-title').textContent=label[mode];
 try{
  const data=dataForExport(),result=mode==='yaml'?buildPipeline(data):mode==='bash'?buildScript(data):buildFFmpeg(data);
  lastCode=result.command;lastError='';
  $('code-output').textContent=lastCode;
  $('code-warning').textContent=(result.warning?result.warning+' ':'')+'Run from the directory containing the input files. Host codec availability must be checked locally.';
 }catch(error){
  lastCode='';lastError=error.message;$('code-output').textContent='# '+error.message;
  $('code-warning').textContent='Command generation is blocked until the project is valid.';
 }
 $('copy').disabled=!lastCode;$('download').disabled=!lastCode;
}
function render(){renderAssets();renderTimeline();renderProperties();renderPreview();renderCode();}
function changeRange(){
 if(!selected)return;
 const start=Number($('clip-in').value),end=Number($('clip-out').value);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>selected.duration+.001||end-start<.01){tell('Choose valid IN/OUT seconds inside the source duration.');renderProperties();return;}
 selected.start=start;selected.end=end;
 const preview=selected.kind==='video'?video:audioPreview;
 if(preview.currentTime<start||preview.currentTime>end)preview.currentTime=start;
 tell('');render();
}
for(const id of ['clip-in','clip-out'])$(id).addEventListener('change',changeRange);
$('audio-offset').addEventListener('change',()=>{if(!project.audio)return;project.audio.offset=Math.max(0,Math.min(3600,Number($('audio-offset').value)||0));render()});
$('audio-volume').addEventListener('input',()=>{if(!project.audio)return;project.audio.volume=Number($('audio-volume').value)/100;audioPreview.volume=Math.min(1,project.audio.volume);renderCode();$('gain-value').textContent=Math.round(project.audio.volume*100)+'%'});
for(const [id,dir] of [['move-left',-1],['move-right',1]])$(id).addEventListener('click',()=>{const i=project.videos.indexOf(selected),j=i+dir;if(i<0||j<0||j>=project.videos.length)return;[project.videos[i],project.videos[j]]=[project.videos[j],project.videos[i]];render()});
$('remove-clip').addEventListener('click',()=>{if(!selected)return;const clip=selected;if(clip.kind==='audio')project.audio=null;else project.videos=project.videos.filter(v=>v!==clip);selected=project.videos.at(0)??project.audio;currentPreview=null;video.pause();audioPreview.pause();video.removeAttribute('src');audioPreview.removeAttribute('src');URL.revokeObjectURL(clip.url);render()});
function clearProject(){for(const clip of allClips())URL.revokeObjectURL(clip.url);video.pause();audioPreview.pause();video.removeAttribute('src');audioPreview.removeAttribute('src');project.videos=[];project.audio=null;currentPreview=null;selected=null;tell('Project cleared. Media objects have been released from this page.');render()}
$('reset').addEventListener('click',()=>{if(allClips().length&&window.confirm('Clear this local editing session?'))clearProject();else if(!allClips().length)clearProject()});
for(const id of ['media-input','drop-input'])$(id).addEventListener('change',async event=>{const files=Array.from(event.target.files??[]);event.target.value='';await loadFiles(files)});
const zone=$('dropzone');zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragging')});zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));
zone.addEventListener('drop',async e=>{e.preventDefault();zone.classList.remove('dragging');await loadFiles(Array.from(e.dataTransfer.files))});
zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('drop-input').click()}});
$('format').addEventListener('change',()=>{const format=$('format').value;project.output=project.output.replace(/\.(mp4|webm)$/i,'.'+format);$('output-file').value=project.output;renderCode()});
$('resolution').addEventListener('change',()=>{[project.width,project.height]=$('resolution').value.split('x').map(Number);renderCode()});
$('fps').addEventListener('change',()=>{project.fps=Number($('fps').value);renderCode()});
$('output-file').addEventListener('input',()=>{project.output=$('output-file').value;renderCode()});
document.querySelectorAll('[data-code]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.code;document.querySelectorAll('[data-code]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderCode()}));
async function copy(){if(!lastCode)return;try{await navigator.clipboard.writeText(lastCode);const button=$('copy');button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1300)}catch{tell('Clipboard blocked. Select the text in the code block and copy it manually.')}}
$('copy').addEventListener('click',copy);
$('download').addEventListener('click',()=>{
 if(!lastCode)return;const ext=mode==='yaml'?'yaml':mode==='bash'?'sh':'txt',name=mode==='yaml'?'pipeline.yaml':mode==='bash'?'render.sh':'ffmpeg-command.txt';
 const blob=new Blob([lastCode+'\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=makeNode('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
