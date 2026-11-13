// Browser-only media metadata helper. No fetch, upload or media processing.
export function probeDuration(file, objectURL, kind, options={}) {
  const makeElement=options.createElement??(tag=>document.createElement(tag));
  const element=makeElement(kind==='video'?'video':'audio');
  const timeoutMs=options.timeoutMs??12000;
  element.preload='metadata';
  return new Promise((resolve,reject)=>{
    let settled=false;
    const complete=(duration,error)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      element.onloadedmetadata=null;
      element.onerror=null;
      element.removeAttribute('src');
      element.load();
      if(error)reject(new Error(error));
      else resolve(duration);
    };
    const timer=setTimeout(()=>complete(null,'Timed out reading metadata for '+file.name),timeoutMs);
    element.onloadedmetadata=()=>{
      const duration=element.duration;
      if(!Number.isFinite(duration)||duration<=0)complete(null,'Unable to determine duration for '+file.name);
      else complete(duration);
    };
    element.onerror=()=>complete(null,'This browser cannot inspect '+file.name+'; try an audio/video format with browser playback support.');
    element.src=objectURL;
  });
}
