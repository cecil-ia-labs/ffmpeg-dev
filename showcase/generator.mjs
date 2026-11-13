// Client-only command composer. No media is uploaded or processed here.
// Output must be reviewed against host FFmpeg capabilities before local execution.
const MIN_DURATION = 0.01;
export function shellQuote(value) {
  if (typeof value !== 'string' || value.includes('\0') || value.includes('\n') || value.includes('\r')) throw new Error('Invalid file path');
  return "'" + value.replaceAll("'", "'\\''") + "'";
}
export function pathForShell(name) {
  if (typeof name !== 'string' || !name || /[\\/\0\r\n]/.test(name)) throw new Error('Use a filename relative to the working directory');
  return './' + name;
}
export function outputFormat(name) { return name.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4'; }
const number = (value, places=3) => Number(Number(value).toFixed(places)).toString();
function normalize(project) {
  const videos=project.videos??[];
  if(!videos.length) throw new Error('Add at least one video');
  if(videos.length>8) throw new Error('This studio supports up to eight video clips');
  for(const clip of videos){
    if(!Number.isFinite(clip.duration)||clip.duration<=0||!Number.isFinite(clip.start)||!Number.isFinite(clip.end)||clip.start<0||clip.end-clip.start<MIN_DURATION||clip.end>clip.duration+.025) throw new Error('Invalid in/out range in '+clip.name);
    pathForShell(clip.name);
  }
  const duration=videos.reduce((n,v)=>n+v.end-v.start,0);
  if(project.audio){
    const a=project.audio;
    if(!Number.isFinite(a.duration)||a.duration<=0||!Number.isFinite(a.start)||!Number.isFinite(a.end)||a.start<0||a.end-a.start<MIN_DURATION||a.end>a.duration+.025)throw new Error('Invalid audio in/out range');
    if(!Number.isFinite(a.offset)||a.offset<0||!Number.isFinite(a.volume)||a.volume<0||a.volume>2)throw new Error('Invalid audio offset or volume');
    if(a.offset>=duration)throw new Error('Audio begins after the video ends; move the soundtrack earlier');
    pathForShell(a.name);
  }
  const width=Number(project.width),height=Number(project.height),fps=Number(project.fps);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<160||height<120||width>3840||height>2160||width%2||height%2)throw new Error('Output dimensions must be even, between 160×120 and 3840×2160');
  if(![24,25,30,60].includes(fps))throw new Error('Choose 24, 25, 30 or 60 fps');
  const output=project.output?.trim();
  if(!output||!/^([A-Za-z0-9][A-Za-z0-9._-]*)\.(mp4|webm)$/.test(output))throw new Error('Output must be a safe .mp4 or .webm filename');
  const names=[...videos.map(v=>v.name),...(project.audio?[project.audio.name]:[])];
  if(new Set(names).size!==names.length)throw new Error('Inputs have duplicate filenames; rename the files locally before generating a command');
  if(names.includes(output))throw new Error('Output cannot overwrite an input filename');
  return {videos,audio:project.audio??null,width,height,fps,output,format:outputFormat(output),duration};
}
export function buildFFmpeg(project){
  const p=normalize(project),inputs=[],filters=[],maps=[];
  for(const v of p.videos)inputs.push('-ss '+number(v.start)+' -t '+number(v.end-v.start)+' -i '+shellQuote(pathForShell(v.name)));
  if(p.audio)inputs.push('-ss '+number(p.audio.start)+' -t '+number(p.audio.end-p.audio.start)+' -i '+shellQuote(pathForShell(p.audio.name)));
  const scale='scale='+p.width+':'+p.height+':force_original_aspect_ratio=decrease,pad='+p.width+':'+p.height+':(ow-iw)/2:(oh-ih)/2,setsar=1,fps='+p.fps+',format=yuv420p';
  for(let i=0;i<p.videos.length;i++)filters.push('['+i+':v:0]setpts=PTS-STARTPTS,'+scale+'[v'+i+']');
  if(p.videos.length===1){filters.push('[v0]null[vout]');}
  else filters.push(p.videos.map((_,i)=>'[v'+i+']').join('')+'concat=n='+p.videos.length+':v=1:a=0[vout]');
  maps.push('-map '+shellQuote('[vout]'));
  let warning='';
  if(p.audio){
    const a=p.audio,idx=p.videos.length;
    const delay=Math.round(a.offset*1000);
    filters.push('['+idx+':a:0]asetpts=PTS-STARTPTS,volume='+number(a.volume)+',adelay='+delay+':all=1,apad=whole_dur='+number(p.duration)+'[aout]');
    maps.push('-map '+shellQuote('[aout]'));
    if(a.offset+a.end-a.start<p.duration-.025)warning='The selected soundtrack is padded with silence to the full video duration.';
    else if(a.offset+a.end-a.start>p.duration+.025)warning='The soundtrack extends beyond the video and will be trimmed to its duration.';
  }else if(p.videos.length===1){
    maps.push('-map 0:a?');
  }else{
    warning='Multiple video clips are exported without their original audio. Add a soundtrack if audio is needed.';
  }
  const codecs=p.format==='mp4'?'-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p'+(p.audio||p.videos.length===1?' -c:a aac -b:a 160k':'')+' -movflags +faststart':'-c:v libvpx-vp9 -b:v 0 -crf 32'+(p.audio||p.videos.length===1?' -c:a libopus -b:a 128k':'');
  const parts=['ffmpeg -hide_banner',...inputs,'-filter_complex '+shellQuote(filters.join(';')),...maps,codecs,'-t '+number(p.duration),shellQuote(pathForShell(p.output))];
  return {command:parts.join(' \\\n  '),duration:p.duration,warning,kind:'FFmpeg native command'};
}
export function buildPipeline(project){
  const p=normalize(project);
  if(p.videos.length!==1||p.audio)throw new Error('The toolkit v1 YAML pipeline supports one video input with no separate soundtrack; use the native command for multi-clip or audio compositions.');
  const v=p.videos[0],format=p.format;
  const quoteYaml=s=>JSON.stringify(s);
  const lines=['version: 1','input: '+quoteYaml(v.name),'steps:'];
  if(v.start>0||v.end<v.duration-.025){
    lines.push('  - trim:','      start: '+number(v.start),'      end: '+number(v.end),'      mode: accurate');
  }
  lines.push('  - resize:','      width: '+p.width,'      height: '+p.height,'      fit: contain','      to: '+format,'  - convert:','      to: '+format,'output:','  path: '+quoteYaml(p.output),'  codec: '+(format==='mp4'?'h264':'vp9'));
  return {command:lines.join('\n'),duration:p.duration,warning:'Pipeline v1 uses the canonical toolkit schema. Validate with: cecilia-ffmpeg pipeline project.yaml validate',kind:'Toolkit YAML pipeline'};
}
export function buildScript(project){
  const output=buildFFmpeg(project);
  return {...output,kind:'Executable Bash script',command:'#!/usr/bin/env bash\nset -euo pipefail\n\n# Run from the directory containing all selected input files.\n'+output.command+'\n'};
}
