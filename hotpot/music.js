// ===== 《火鍋夜驚魂》chiptune BGM engine =====
// Tracks: title（家裡的火鍋夜，C 宮調 92 BPM）／battle（門外的飢餓者，A 小調五聲 132 BPM，可隨危險程度加層）
// Jingles: win / lose / sting（殭屍潮警報）
const music=(()=>{
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const CH={Am:[57,60,64],F:[53,57,60],G:[55,59,62],E:[52,56,59],C:[48,52,55],Dm:[50,53,57]};
  const _=-1,o=0; // _ = sustain, o = rest
  const TRACKS={
    title:{bpm:92,
      chords:['C','Am','F','G','C','Am','F','G'],
      mel:[
        76,_,79,_,81,79,76,_,  74,_,76,_,72,_,_,o,
        69,_,72,74,76,_,74,72, 74,_,_,_,_,_,o,o,
        76,_,79,_,81,_,84,_,   81,79,76,_,74,_,76,_,
        74,72,69,_,72,_,74,_,  72,_,_,_,_,_,o,o],
    },
    battle:{bpm:132,
      chords:['Am','Am','F','G','Am','Am','F','E','F','G','Am','Am','F','G','E','Am'],
      mel:[
        76,o,74,72,69,_,72,74,   76,_,79,76,74,_,_,o,
        72,_,69,72,74,_,72,69,   67,_,69,_,72,_,74,_,
        76,o,74,72,69,_,72,74,   76,_,79,81,79,76,74,_,
        72,74,76,_,74,72,69,_,   68,_,71,_,76,_,_,o,
        81,_,79,76,79,_,76,74,   74,_,76,_,79,_,_,o,
        76,74,72,74,76,_,69,_,   72,_,74,_,69,_,_,o,
        81,_,79,76,79,_,81,_,    79,_,76,74,76,_,79,_,
        80,_,76,_,71,_,68,_,     69,_,_,_,o,o,72,74],
    },
  };
  const noiseCache=new WeakMap();
  function noiseBuf(ac){let b=noiseCache.get(ac);if(b)return b;b=ac.createBuffer(1,ac.sampleRate*0.5,ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;noiseCache.set(ac,b);return b;}
  function tone(ac,dest,t,type,midi,dur,vol,opt){
    opt=opt||{};const os=ac.createOscillator(),g=ac.createGain();
    os.type=type;os.frequency.setValueAtTime(mtof(midi),t);
    if(opt.vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.5;lg.gain.value=mtof(midi)*0.012;l.connect(lg);lg.connect(os.frequency);l.start(t+0.12);l.stop(t+dur+0.05);}
    const a=opt.a||0.005,rel=opt.r||0.05;
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);
    g.gain.setValueAtTime(vol*(opt.sus??0.75),t+Math.max(a,dur-rel));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+rel);
    os.connect(g);g.connect(dest);os.start(t);os.stop(t+dur+rel+0.02);
  }
  function noise(ac,dest,t,dur,vol,freq,type){
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
    s.buffer=noiseBuf(ac);f.type=type||'highpass';f.frequency.value=freq;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+0.02);
  }
  function kick(ac,dest,t,vol){const os=ac.createOscillator(),g=ac.createGain();os.type='sine';os.frequency.setValueAtTime(150,t);os.frequency.exponentialRampToValueAtTime(42,t+0.12);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);os.connect(g);g.connect(dest);os.start(t);os.stop(t+0.2);}
  function block(ac,dest,t,vol,f){const os=ac.createOscillator(),g=ac.createGain();os.type='triangle';os.frequency.setValueAtTime(f||1400,t);os.frequency.exponentialRampToValueAtTime((f||1400)*0.7,t+0.05);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.07);os.connect(g);g.connect(dest);os.start(t);os.stop(t+0.08);}
  function sustainLen(mel,i){let n=1;while(i+n<mel.length&&mel[i+n]===-1)n++;return n;}

  // schedule one 16th-note step
  function step(ac,dest,name,s,t,inten,bpmMul){
    const tr=TRACKS[name],q=60/(tr.bpm*bpmMul)/4,bar=Math.floor(s/16)%tr.chords.length,p=s%16,ch=CH[tr.chords[bar]];
    const mi=bar*8+(p>>1);
    if(name==='title'){
      if(p%2===0){const m=tr.mel[mi];if(m>0){const len=sustainLen(tr.mel,mi)*2*q;tone(ac,dest,t,'triangle',m,len*0.95,0.22,{vib:len>0.4,r:0.08});tone(ac,dest,t+0.01,'square',m-12,len*0.6,0.025,{r:0.05});}}
      if(p===0)tone(ac,dest,t,'triangle',ch[0]-12,q*7.5,0.2,{r:0.1});
      if(p===8)tone(ac,dest,t,'triangle',ch[0]-5,q*7.5,0.16,{r:0.1});
      if(p===4||p===12)block(ac,dest,t,0.09,1300);
      if(p===14)block(ac,dest,t,0.05,1800);
      if(p%4===2)noise(ac,dest,t,0.03,0.025,7000);
      if(p===0||p===8){ch.forEach((n,i)=>tone(ac,dest,t+i*0.03,'square',n+12,q*3,0.012,{r:0.15}));}
      return;
    }
    // battle
    if(p%2===0){const m=tr.mel[mi];if(m>0){const len=sustainLen(tr.mel,mi)*2*q;tone(ac,dest,t,'square',m,len*0.9,0.075,{vib:len>0.35,sus:0.6});if(inten>=2)tone(ac,dest,t,'square',m+12,len*0.5,0.022,{sus:0.4});}}
    if(p%2===0){const root=ch[0]-12;tone(ac,dest,t,'triangle',(p%4===0)?root:root+12,q*1.7,0.24,{sus:0.6,r:0.03});}
    if(p===0||p===8||(inten>=2&&(p===6||p===10)))kick(ac,dest,t,0.55);
    if(p===4||p===12)noise(ac,dest,t,0.11,0.16,1800,'bandpass');
    if(inten>=1?true:(p%4===2))noise(ac,dest,t,0.025,inten>=1?0.035:0.05,7500);
    if(p===7||p===15)block(ac,dest,t,0.05,1500);
    if(inten>=1){const arp=[ch[0],ch[1],ch[2],ch[1]];tone(ac,dest,t,'square',arp[p%4]+12,q*0.8,0.022,{sus:0.3,r:0.02});}
    if(inten>=2&&p===0)tone(ac,dest,t,'sawtooth',ch[0]-24,q*14,0.035,{a:0.2,sus:0.8,r:0.2});
  }
  function trackLen(name){return TRACKS[name].chords.length*16;}

  // ---- realtime player ----
  let ac=null,master=null,timer=null,cur=null,s=0,nextT=0,inten=0,bpmMul=1,enabled=true,vol=0.55;
  function ensure(c){if(ac)return true;ac=c;if(!ac)return false;master=ac.createGain();master.gain.value=enabled?vol:0;master.connect(ac.destination);return true;}
  function tick(){
    if(!cur||!ac)return;
    while(nextT<ac.currentTime+0.15){
      step(ac,master,cur,s,nextT,inten,bpmMul);
      nextT+=60/(TRACKS[cur].bpm*bpmMul)/4;s=(s+1)%trackLen(cur);
    }
  }
  function play(name,c){
    if(!ensure(c))return;if(ac.state==='suspended')ac.resume();
    if(cur===name)return;cur=name;s=0;nextT=ac.currentTime+0.08;inten=0;bpmMul=1;
    if(!timer)timer=setInterval(tick,25);
  }
  function stop(){cur=null;}
  function jingle(kind,c){
    if(!ensure(c))return;stop();const t=ac.currentTime+0.05;
    if(kind==='win'){[72,76,79,84].forEach((m,i)=>tone(ac,master,t+i*0.12,'square',m,0.14,0.08));[60,64,67,72].forEach(m=>tone(ac,master,t+0.5,'triangle',m,1.4,0.12,{vib:true,r:0.4}));tone(ac,master,t+0.5,'square',88,1.2,0.04,{vib:true,r:0.4});}
    if(kind==='lose'){[64,63,62,61].forEach((m,i)=>tone(ac,master,t+i*0.32,'square',m,0.3,0.07,{vib:true}));tone(ac,master,t+1.3,'triangle',45,1.6,0.25,{r:0.5});tone(ac,master,t+1.3,'square',57,1.6,0.03,{vib:true,r:0.5});}
  }
  function sting(){if(!ac||!enabled)return;const t=ac.currentTime+0.02;[0,0.18].forEach(d=>{tone(ac,master,t+d,'sawtooth',40,0.16,0.08);tone(ac,master,t+d,'square',46,0.16,0.04);});}
  function setIntensity(n,mul){inten=n;bpmMul=mul||1;}
  function toggle(){enabled=!enabled;if(master)master.gain.value=enabled?vol:0;return enabled;}

  // ---- offline render (WAV export) ----
  async function render(name,loops,intenLevel,mul,sr){
    sr=sr||44100;mul=mul||1;const q=60/(TRACKS[name].bpm*mul)/4,n=trackLen(name)*loops,dur=n*q+1.5;
    const oc=new OfflineAudioContext(1,Math.ceil(dur*sr),sr);const g=oc.createGain();g.gain.value=0.8;g.connect(oc.destination);
    for(let i=0;i<n;i++)step(oc,g,name,i%trackLen(name),0.02+i*q,intenLevel,mul);
    return oc.startRendering();
  }
  function wav(buf){
    const d=buf.getChannelData(0),len=d.length,ab=new ArrayBuffer(44+len*2),v=new DataView(ab);
    const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
    let peak=0;for(let i=0;i<len;i++)peak=Math.max(peak,Math.abs(d[i]));const norm=peak>0?0.89/peak:1;
    ws(0,'RIFF');v.setUint32(4,36+len*2,true);ws(8,'WAVE');ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
    v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);ws(36,'data');v.setUint32(40,len*2,true);
    for(let i=0;i<len;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,d[i]*norm))*32767,true);
    return ab;
  }
  return {play,stop,jingle,sting,setIntensity,toggle,render,wav,get enabled(){return enabled;},get current(){return cur;}};
})();
