import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function getCtx(r){
  if(!r.current)r.current=new(window.AudioContext||window.webkitAudioContext)()
  if(r.current.state==='suspended')r.current.resume()
  return r.current
}
function playKick(c,t,v=1){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.3);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.4);o.start(t);o.stop(t+0.41)}
function playSnare(c,t,v=1){const b=c.createBuffer(1,c.sampleRate*0.2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<b.length;i++)d[i]=Math.random()*2-1;const n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();n.buffer=b;f.type='bandpass';f.frequency.value=3000;n.connect(f);f.connect(g);g.connect(c.destination);g.gain.setValueAtTime(v*0.8,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);n.start(t);n.stop(t+0.19)}
function playHH(c,t,v=1){const b=c.createBuffer(1,c.sampleRate*0.08,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<b.length;i++)d[i]=Math.random()*2-1;const n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();n.buffer=b;f.type='highpass';f.frequency.value=9000;n.connect(f);f.connect(g);g.connect(c.destination);g.gain.setValueAtTime(v*0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.06);n.start(t);n.stop(t+0.07)}
function playClick(c,t,ac){const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=ac?1400:900;g.gain.setValueAtTime(ac?0.4:0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.04);o.start(t);o.stop(t+0.045)}

const RD=[
{id:'single',ph:1,or:0,nm:'Single Stroke Roll',ds:'Um golpe por mão.',bm:[60,120],xp:30,cl:'#3B82F6',sq:[{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],tp:'Braço inteiro, sem tensão.'},
{id:'double',ph:1,or:1,nm:'Double Stroke Roll',ds:'Dois golpes por mão.',bm:[50,100],xp:40,cl:'#3B82F6',sq:[{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'}],tp:'O 2° golpe é ricochete.'},
{id:'parad',ph:1,or:2,nm:'Paradiddle',ds:'RLRR LRLL.',bm:[60,110],xp:50,cl:'#3B82F6',sq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'}],tp:'Acente no 1° golpe.'},
{id:'flam',ph:2,or:3,nm:'Flam',ds:'Grace note + principal.',bm:[60,100],xp:55,cl:'#8B5CF6',sq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],tp:'Grace note: baqueta 2cm.'},
{id:'parad2',ph:2,or:4,nm:'Paradiddle Duplo',ds:'RLRLRR.',bm:[60,100],xp:65,cl:'#8B5CF6',sq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'R',h:'R'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'}],tp:'R no chimbal, L na caixa.'},
{id:'swiss',ph:3,or:5,nm:'Swiss Army Triplet',ds:'Flam em tercinas.',bm:[60,95],xp:75,cl:'#EC4899',sq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'R',h:'R'},{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],tp:'BD no 1 de cada trio.'},
{id:'pinv',ph:3,or:6,nm:'Paradiddle Invertido',ds:'RLLR.',bm:[60,100],xp:80,cl:'#EC4899',sq:[{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R',a:1},{l:'R',h:'R'},{l:'L',h:'L'}],ft:[{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'}],tp:'Acento no 2° golpe.'},
{id:'flamp',ph:4,or:7,nm:'Flam Paradiddle',ds:'lRLRR.',bm:[70,110],xp:90,cl:'#F59E0B',sq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'R',h:'R'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'}],tp:'Groove Latin com drive.'},
{id:'6st',ph:4,or:8,nm:'6-Stroke Roll',ds:'R LL R LL.',bm:[70,120],xp:100,cl:'#F59E0B',sq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R',a:1},{l:'L',h:'L'}],ft:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],tp:'Doubles precisos.'},
]

const LV=[{m:0,t:'Aprendiz',i:'🥁'},{m:100,t:'Iniciante',i:'🎵'},{m:250,t:'Praticante',i:'🎶'},{m:500,t:'Músico',i:'⭐'},{m:800,t:'Ministro',i:'🌟'},{m:1200,t:'Mestre',i:'👑'}]
function getLV(xp){let l=LV[0];for(const v of LV){if(xp>=v.m)l=v}const i=LV.indexOf(l),nx=LV[i+1];return{...l,nx,pg:nx?Math.min(100,Math.round(((xp-l.m)/(nx.m-l.m))*100)):100,i}}
function stars(bpm,r){const p=(bpm-r[0])/(r[1]-r[0]);return p>=0.85?3:p>=0.5?2:p>=0.1?1:0}
function td(){return new Date().toISOString().slice(0,10)}

function useEng(r){
  const cx=useRef(null),tr=useRef(null),nt=useRef(0),bt=useRef(0),on=useRef(false)
  const[bpm,setBS]=useState(80),[play,setPlay]=useState(false),[ab,setAb]=useState(-1)
  const br=useRef(80),rr=useRef(r)
  useEffect(()=>{br.current=bpm},[bpm])
  useEffect(()=>{rr.current=r},[r])
  const fire=useCallback((c,b,t)=>{
    const r=rr.current,i=b%r.sq.length,s=r.sq[i],f=r.ft[i]
    if(!s.g)playSnare(c,t,s.a?1:0.6);else playSnare(c,t,0.1)
    if(f.s==='k')playKick(c,t,0.9)
    if(f.s==='h')playHH(c,t,0.5)
    playClick(c,t,i===0)
    setTimeout(()=>setAb(i),Math.max(0,(t-c.currentTime)*1000))
  },[])
  const sc=useCallback(()=>{
    if(!on.current)return
    const c=cx.current,iv=60/br.current
    while(nt.current<c.currentTime+0.25){fire(c,bt.current,nt.current);nt.current+=iv;bt.current++}
    tr.current=setTimeout(sc,30)
  },[fire])
  const start=useCallback(()=>{const c=getCtx(cx);bt.current=0;nt.current=c.currentTime+0.05;on.current=true;setPlay(true);sc()},[sc])
  const stop=useCallback(()=>{on.current=false;setPlay(false);setAb(-1);if(tr.current)clearTimeout(tr.current)},[])
  const setBpm=useCallback((v)=>{setBS(v);br.current=v},[])
  useEffect(()=>()=>{on.current=false;if(tr.current)clearTimeout(tr.current)},[])
  return{bpm,setBpm,play,ab,start,stop}
}

function St({n,z=15}){return <span>{[1,2,3].map(i=><span key={i} style={{fontSize:z,filter:i<=n?'none':'grayscale(1) opacity(0.2)'}}>⭐</span>)}</span>}

function Viz({r,ab,play}){
  return(
    <div style={{marginTop:12}}>
      <div style={{fontSize:10,color:'#64748B',fontWeight:700,marginBottom:4}}>MÃOS</div>
      <div style={{display:'flex',gap:3,marginBottom:6}}>
        {r.sq.map((s,i)=>{const lit=play&&ab===i,tc=s.g?'#475569':s.h==='R'?'#60A5FA':'#F472B6';return(
          <div key={i} style={{flex:1,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,position:'relative',background:lit?r.cl:s.g?'#1a2234':'#0F172A',border:`1.5px solid ${lit?r.cl:'#1E293B'}`,boxShadow:lit?`0 0 10px ${r.cl}80`:'none',transition:'background 0.06s'}}>
            {s.a&&!s.g&&<span style={{position:'absolute',top:1,fontSize:7,color:lit?'white':r.cl}}>▲</span>}
            <span style={{fontSize:10,fontWeight:900,fontFamily:'monospace',color:lit?'white':tc}}>{s.l}</span>
          </div>
        )})}
      </div>
      <div style={{fontSize:10,color:'#64748B',fontWeight:700,marginBottom:4}}>PÉS</div>
      <div style={{display:'flex',gap:3}}>
        {r.ft.map((f,i)=>{const lit=play&&ab===i&&!!f.s,fc=f.l==='BD'?'#F59E0B':'#10B981';return(
          <div key={i} style={{flex:1,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,background:lit?fc:f.s?'#0F172A':'transparent',border:`1.5px solid ${lit?fc:f.s?'#1E293B':'transparent'}`,boxShadow:lit?`0 0 8px ${fc}80`:'none',transition:'background 0.06s'}}>
            <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:lit?'#0F172A':f.s?fc:'#1E293B'}}>{f.l}</span>
          </div>
        )})}
      </div>
    </div>
  )
}

export default function App(){
  const[al,setAl]=useState(null),[nm,setNm]=useState(''),[sn,setSn]=useState(''),[er,setEr]=useState(''),[ld,setLd]=useState(false)
  const[sel,setSel]=useState(RD[0]),[tab,setTab]=useState('t'),[mod,setMod]=useState(null),[tst,setTst]=useState(null),[sec,setSec]=useState(0)
  const sr=useRef(null),sc=useRef(0),eng=useEng(sel)

  useEffect(()=>{
    if(eng.play){sc.current=0;setSec(0);sr.current=setInterval(()=>{sc.current++;setSec(sc.current)},1000)}
    else if(sr.current)clearInterval(sr.current)
    return()=>{if(sr.current)clearInterval(sr.current)}
  },[eng.play])

  const toast=(m,c='#3B82F6')=>{setTst({m,c});setTimeout(()=>setTst(null),3000)}

  const entrar=async()=>{
    if(!nm.trim()||!sn.trim())return;setLd(true);setEr('')
    const{data}=await supabase.from('alunos').select('*').eq('name',nm.trim()).eq('senha',sn.trim()).single()
    if(data)setAl(data);else setEr('Nome ou senha incorretos.');setLd(false)
  }

  const cadastrar=async()=>{
    if(!nm.trim()||!sn.trim())return;setLd(true);setEr('')
    const{data}=await supabase.from('alunos').insert([{name:nm.trim(),senha:sn.trim()}]).select().single()
    if(data)setAl(data);else setEr('Nome já existe.');setLd(false)
  }

  const salvar=async(u)=>{
    const{data}=await supabase.from('alunos').update(u).eq('id',al.id).select().single()
    if(data)setAl(data)
  }

  const stop=()=>{
    eng.stop();const e=sc.current;if(e<5)return
    const st=stars(eng.bpm,sel.bm),xp=Math.round(sel.xp*(st===3?1:st===2?0.6:0.3))
    const ns={...(al.stars||{}),[sel.id]:Math.max((al.stars||{})[sel.id]||0,st)}
    const nu=[...(al.unlocked||['single'])],nx=RD.find(r=>r.or===sel.or+1)
    if(nx&&!nu.includes(nx.id)&&st>=1){nu.push(nx.id);setTimeout(()=>toast(`🔓 ${nx.nm}!`,nx.cl),1500)}
    salvar({xp:(al.xp||0)+xp,stars:ns,unlocked:nu,practice_days:[...new Set([...(al.practice_days||[]),td()])],total_minutes:(al.total_minutes||0)+Math.floor(e/60)})
    setMod({st,xp,e})
  }

  const lv=getLV(al?.xp||0)

  if(!al)return(
    <div style={{minHeight:'100vh',background:'#0F172A',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{maxWidth:340,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}>🥁</div>
        <div style={{color:'white',fontWeight:900,fontSize:22,marginBottom:4}}>Drum Training</div>
        <div style={{color:'#64748B',fontSize:13,marginBottom:32}}>Ministério de Louvor Rendição</div>
        {er&&<div style={{background:'#EF444420',border:'1px solid #EF4444',borderRadius:8,padding:10,marginBottom:16,color:'#EF4444',fontSize:13}}>{er}</div>}
        <input value={nm} onChange={e=>setNm(e.target.value)} placeholder='Seu nome...' style={{width:'100%',padding:14,borderRadius:10,border:'2px solid #334155',background:'#1E293B',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',marginBottom:10,textAlign:'center'}}/>
        <input value={sn} onChange={e=>setSn(e.target.value)} placeholder='Senha...' type='password' style={{width:'100%',padding:14,borderRadius:10,border:'2px solid #334155',background:'#1E293B',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',marginBottom:16,textAlign:'center'}}/>
        <button onClick={entrar} disabled={ld} style={{width:'100%',padding:14,borderRadius:10,border:'none',background:'#3B82F6',color:'white',fontWeight:900,fontSize:15,cursor:'pointer',marginBottom:10}}>{ld?'Entrando...':'▶ Entrar'}</button>
        <button onClick={cadastrar} disabled={ld} style={{width:'100%',padding:14,borderRadius:10,border:'2px solid #334155',background:'transparent',color:'#94A3B8',fontWeight:700,fontSize:14,cursor:'pointer'}}>Criar conta nova</button>
      </div>
    </div>
  )

  return(
    <div style={{fontFamily:"sans-serif",minHeight:'100vh',background:'#F1F5F9',maxWidth:480,margin:'0 auto'}}>
      {tst&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:300,background:tst.c,color:'white',padding:'10px 20px',borderRadius:30,fontWeight:800,fontSize:13,whiteSpace:'nowrap'}}>{tst.m}</div>}
      {mod&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
          <div style={{background:'#1E293B',borderRadius:20,padding:'28px 22px',maxWidth:340,width:'100%',textAlign:'center'}}>
            <div style={{fontSize:52,marginBottom:8}}>{mod.st===3?'🏆':mod.st===2?'🌟':'⭐'}</div>
            <div style={{color:'white',fontWeight:900,fontSize:20,marginBottom:8}}>{mod.st===3?'Excelente!':mod.st===2?'Muito bom!':'Continue!'}</div>
            <St n={mod.st} z={26}/>
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{background:'#0F172A',borderRadius:10,padding:10}}><div style={{color:'#64748B',fontSize:11}}>BPM</div><div style={{color:sel.cl,fontWeight:900,fontSize:26,fontFamily:'monospace'}}>{eng.bpm}</div></div>
              <div style={{background:'#0F172A',borderRadius:10,padding:10}}><div style={{color:'#64748B',fontSize:11}}>Tempo</div><div style={{color:'#10B981',fontWeight:900,fontSize:26,fontFamily:'monospace'}}>{Math.floor(mod.e/60)}:{String(mod.e%60).padStart(2,'0')}</div></div>
            </div>
            <div style={{marginTop:12,color:'#FCD34D',fontWeight:900,fontSize:20}}>+{mod.xp} XP ✨</div>
            <button onClick={()=>setMod(null)} style={{marginTop:18,width:'100%',padding:13,borderRadius:10,background:sel.cl,border:'none',color:'white',fontWeight:900,fontSize:15,cursor:'pointer'}}>Continuar →</button>
          </div>
        </div>
      )}
      <div style={{background:'linear-gradient(135deg,#0F172A,#1E293B)',padding:'14px 16px 10px',position:'sticky',top:0,zIndex:10,borderBottom:'1px solid #334155'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>🥁</span>
            <div><div style={{color:'white',fontWeight:900,fontSize:14}}>Olá, {al.name}!</div><div style={{color:'#475569',fontSize:10}}>Ministério Rendição</div></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,background:'#1E293B',borderRadius:20,padding:'4px 10px'}}>
            <span>{lv.i}</span><span style={{color:'#FCD34D',fontWeight:900,fontSize:13}}>{al.xp||0} XP</span>
          </div>
        </div>
        <div style={{background:'#1E293B',borderRadius:99,height:4,overflow:'hidden'}}><div style={{width:`${lv.pg}%`,height:'100%',background:'linear-gradient(90deg,#3B82F6,#8B5CF6)',borderRadius:99}}/></div>
      </div>
      <div style={{display:'flex',background:'white',borderBottom:'2px solid #E2E8F0'}}>
        {[['t','🎯','Treinar'],['r','🥁','Rudimentos'],['p','👤','Perfil']].map(([id,ic,lb])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 4px',border:'none',borderBottom:tab===id?'3px solid #3B82F6':'3px solid transparent',background:'white',color:tab===id?'#3B82F6':'#94A3B8',fontWeight:700,fontSize:11,cursor:'pointer'}}>
            <div style={{fontSize:16}}>{ic}</div><div>{lb}</div>
          </button>
        ))}
      </div>
      <div style={{padding:14}}>
        {tab==='t'&&(
          <>
            <div style={{background:'white',borderRadius:14,padding:16,border:`2px solid ${sel.cl}25`,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontWeight:900,fontSize:17,color:'#0F172A'}}>{sel.nm}</div><div style={{fontSize:12,color:'#64748B',marginTop:2}}>{sel.ds}</div></div>
                <div style={{background:sel.cl,color:'white',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20}}>F{sel.ph}</div>
              </div>
              <div style={{marginTop:10,background:'#F8FAFC',borderRadius:8,padding:'9px 12px',border:'1px solid #E2E8F0',fontSize:12,color:'#475569'}}>💡 {sel.tp}</div>
              <Viz r={sel} ab={eng.ab} play={eng.play}/>
            </div>
            <div style={{background:'#0F172A',borderRadius:14,padding:14,border:'1px solid #1E293B'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <div style={{color:'#94A3B8',fontWeight:800,fontSize:10}}>⏱ METRÔNOMO</div>
                <div style={{fontFamily:'monospace',fontSize:18,color:eng.play?'#EF4444':'#475569',fontWeight:900}}>{String(Math.floor(sec/60)).padStart(2,'0')}:{String(sec%60).padStart(2,'0')}</div>
              </div>
              <div style={{textAlign:'center',marginBottom:8}}><span style={{fontSize:42,fontWeight:900,color:sel.cl,fontFamily:'monospace'}}>{eng.bpm}</span><span style={{color:'#475569',fontSize:12,marginLeft:4}}>BPM</span></div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                {[1,2,3].map(s=>{const n=s===1?sel.bm[0]+(sel.bm[1]-sel.bm[0])*0.1:s===2?sel.bm[0]+(sel.bm[1]-sel.bm[0])*0.5:sel.bm[0]+(sel.bm[1]-sel.bm[0])*0.85;return <div key={s} style={{flex:1,textAlign:'center',opacity:eng.bpm>=n?1:0.3}}><div style={{fontSize:14}}>⭐</div><div style={{fontSize:8,color:eng.bpm>=n?'#FCD34D':'#475569',fontWeight:700}}>{Math.round(n)}</div></div>})}
              </div>
              <input type='range' min={40} max={200} value={eng.bpm} onChange={e=>{if(eng.play)eng.stop();eng.setBpm(Number(e.target.value))}} style={{width:'100%',accentColor:sel.cl,cursor:'pointer',marginBottom:8}}/>
              <div style={{display:'flex',gap:5,justifyContent:'center',marginBottom:10}}>
                {[60,80,100,120].map(v=><button key={v} onClick={()=>{if(eng.play)eng.stop();eng.setBpm(v)}} style={{padding:'4px 10px',borderRadius:6,border:`1.5px solid ${eng.bpm===v?sel.cl:'#334155'}`,background:eng.bpm===v?sel.cl+'25':'transparent',color:eng.bpm===v?sel.cl:'#64748B',fontSize:11,fontWeight:700,cursor:'pointer'}}>{v}</button>)}
              </div>
              <button onClick={()=>eng.play?stop():eng.start()} style={{width:'100%',padding:12,borderRadius:10,border:'none',background:eng.play?'#EF4444':sel.cl,color:'white',fontSize:14,fontWeight:900,cursor:'pointer'}}>
                {eng.play?'⏹ PARAR + AVALIAR':'▶ INICIAR SESSÃO'}
              </button>
            </div>
          </>
        )}
        {tab==='r'&&(
          <>
            <div style={{fontSize:12,color:'#94A3B8',marginBottom:12}}>{(al.unlocked||['single']).length}/{RD.length} desbloqueados</div>
            {RD.map(r=>{
              const ul=(al.unlocked||['single']).includes(r.id),ms=(al.stars||{})[r.id]||0
              return <button key={r.id} onClick={()=>{if(ul){eng.stop();setSel(r);eng.setBpm(Math.round((r.bm[0]+r.bm[1])/2));setTab('t')}}} style={{width:'100%',textAlign:'left',padding:'13px 14px',background:sel?.id===r.id?r.cl+'12':ul?'white':'#F8FAFC',border:`2px solid ${sel?.id===r.id?r.cl:'#E2E8F0'}`,borderRadius:10,marginBottom:8,cursor:ul?'pointer':'not-allowed',opacity:ul?1:0.45}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:20}}>{ul?(ms>0?'🥁':'🎵'):'🔒'}</span>
                    <div><div style={{fontWeight:800,font
