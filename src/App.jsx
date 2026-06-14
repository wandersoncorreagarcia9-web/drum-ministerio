import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

// ─── DRUM SYNTHESIS ──────────────────────────────────────────────────────────
function getCtx(ref) {
  if (!ref.current) ref.current = new (window.AudioContext || window.webkitAudioContext)()
  if (ref.current.state === 'suspended') ref.current.resume()
  return ref.current
}
function playKick(ctx,t,v=1){
  const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine'
  o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(40,t+0.25)
  g.gain.setValueAtTime(v*1.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.4);o.start(t);o.stop(t+0.41)
  const c=ctx.createOscillator(),cg=ctx.createGain();c.connect(cg);cg.connect(ctx.destination);c.frequency.value=800
  cg.gain.setValueAtTime(v*0.4,t);cg.gain.exponentialRampToValueAtTime(0.001,t+0.02);c.start(t);c.stop(t+0.025)
}
function playSnare(ctx,t,v=1){
  const sz=ctx.sampleRate*0.2,buf=ctx.createBuffer(1,sz,ctx.sampleRate),d=buf.getChannelData(0)
  for(let i=0;i<sz;i++)d[i]=Math.random()*2-1
  const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain()
  n.buffer=buf;f.type='bandpass';f.frequency.value=3000;f.Q.value=0.8
  n.connect(f);f.connect(g);g.connect(ctx.destination)
  g.gain.setValueAtTime(v*0.9,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);n.start(t);n.stop(t+0.19)
  const o=ctx.createOscillator(),og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='triangle';o.frequency.value=180
  og.gain.setValueAtTime(v*0.5,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.start(t);o.stop(t+0.11)
}
function playHihat(ctx,t,v=1){
  const sz=ctx.sampleRate*0.08,buf=ctx.createBuffer(1,sz,ctx.sampleRate),d=buf.getChannelData(0)
  for(let i=0;i<sz;i++)d[i]=Math.random()*2-1
  const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain()
  n.buffer=buf;f.type='highpass';f.frequency.value=9000
  n.connect(f);f.connect(g);g.connect(ctx.destination)
  g.gain.setValueAtTime(v*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.06);n.start(t);n.stop(t+0.07)
}
function playClick(ctx,t,accent){
  const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination)
  o.frequency.value=accent?1400:900
  g.gain.setValueAtTime(accent?0.4:0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.04);o.start(t);o.stop(t+0.045)
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const RUDIMENTS=[
  {id:'single',phase:1,order:0,name:'Single Stroke Roll',desc:'Um golpe por mão — a base de tudo.',bpm:[60,120],xpReward:30,color:'#3B82F6',
   seq:[{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],
   tip:'Braço inteiro, sem tensão. Deixe a baqueta cair por gravidade.',dyn:'pp → mf'},
  {id:'double',phase:1,order:1,name:'Double Stroke Roll',desc:'Dois golpes por mão — ricochete natural.',bpm:[50,100],xpReward:40,color:'#3B82F6',
   seq:[{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'}],
   tip:'O 2° golpe é ricochete — não force.',dyn:'p → mp'},
  {id:'paradiddle',phase:1,order:2,name:'Paradiddle Simples',desc:'RLRR LRLL — o rudimento mais versátil.',bpm:[60,110],xpReward:50,color:'#3B82F6',
   seq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'}],
   tip:'Acente no 1° golpe de cada grupo.',dyn:'Acento: mf | Resto: p'},
  {id:'flam',phase:2,order:3,name:'Flam',desc:'Grace note (pp) + golpe principal.',bpm:[60,100],xpReward:55,color:'#8B5CF6',
   seq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],
   tip:'Grace note: baqueta 2–3 cm. Principal: baqueta alta.',dyn:'Grace: pp | Principal: mf'},
  {id:'paradiddle2',phase:2,order:4,name:'Paradiddle Duplo',desc:'RLRLRR — 6 notas por grupo.',bpm:[60,100],xpReward:65,color:'#8B5CF6',
   seq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'R',h:'R'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'}],
   tip:'Mova para o kit: R no chimbal, L na caixa.',dyn:'Acentos: f | Tempo: mp'},
  {id:'swiss',phase:3,order:5,name:'Swiss Army Triplet',desc:'Flam + stroke em tercinas.',bpm:[60,95],xpReward:75,color:'#EC4899',
   seq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'R',h:'R'},{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],
   tip:'BD no 1 de cada grupo de 3.',dyn:'Flam: mf-f | Internos: p'},
  {id:'paradiddle-inv',phase:3,order:6,name:'Paradiddle Invertido',desc:'RLLR — acento no 2° golpe.',bpm:[60,100],xpReward:80,color:'#EC4899',
   seq:[{l:'R',h:'R'},{l:'L',h:'L',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'R',h:'R',a:1},{l:'R',h:'R'},{l:'L',h:'L'}],
   feet:[{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'}],
   tip:'Desafiador: acento no 2°.',dyn:'Acento no 2°: f | Outros: p'},
  {id:'flamparadiddle',phase:4,order:7,name:'Flam Paradiddle',desc:'lRLRR — Flam com Paradiddle.',bpm:[70,110],xpReward:90,color:'#F59E0B',
   seq:[{l:'°L',h:'L',g:1},{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'R',h:'R'},{l:'R',h:'R'},{l:'°R',h:'R',g:1},{l:'L',h:'L',a:1},{l:'R',h:'R'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'BD',s:'k'},{l:'—'},{l:'HH',s:'h'},{l:'—'}],
   tip:'Groove Latin/Bossa com drive.',dyn:'Flam: f | Restante: mp'},
  {id:'6stroke',phase:4,order:8,name:'6-Stroke Roll',desc:'R LL R LL — doubles dentro de singles.',bpm:[70,120],xpReward:100,color:'#F59E0B',
   seq:[{l:'R',h:'R',a:1},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R'},{l:'L',h:'L'},{l:'L',h:'L'},{l:'R',h:'R',a:1},{l:'L',h:'L'}],
   feet:[{l:'BD',s:'k'},{l:'—'},{l:'—'},{l:'HH',s:'h'},{l:'—'},{l:'—'},{l:'BD',s:'k'},{l:'—'}],
   tip:'Doubles precisos. Aplique em solos e fills rápidos.',dyn:'Crescendo interno em cada grupo'},
]

const LEVELS=[
  {min:0,title:'Aprendiz',icon:'🥁'},
  {min:100,title:'Iniciante',icon:'🎵'},
  {min:250,title:'Praticante',icon:'🎶'},
  {min:500,title:'Músico',icon:'⭐'},
  {min:800,title:'Ministro',icon:'🌟'},
  {min:1200,title:'Mestre',icon:'👑'},
]

function getLevel(xp){
  let lv=LEVELS[0];for(const l of LEVELS){if(xp>=l.min)lv=l}
  const idx=LEVELS.indexOf(lv),next=LEVELS[idx+1]
  const prog=next?Math.min(100,Math.round(((xp-lv.min)/(next.min-lv.min))*100)):100
  return{...lv,next,prog,idx}
}
function calcStars(bpm,r){const p=(bpm-r[0])/(r[1]-r[0]);return p>=0.85?3:p>=0.5?2:p>=0.1?1:0}
function todayStr(){return new Date().toISOString().slice(0,10)}
// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────
function useEngine(rudiment){
  const ctxRef=useRef(null),timerRef=useRef(null),nextT=useRef(0),beat=useRef(0),on=useRef(false)
  const[bpm,setBpmS]=useState(80),[playing,setPlaying]=useState(false),[activeBeat,setActiveBeat]=useState(-1)
  const bpmR=useRef(bpm),rudR=useRef(rudiment)
  useEffect(()=>{bpmR.current=bpm},[bpm])
  useEffect(()=>{rudR.current=rudiment},[rudiment])
  const fire=useCallback((ctx,b,t)=>{
    const r=rudR.current,idx=b%r.seq.length,s=r.seq[idx],f=r.feet[idx]
    if(!s.g)playSnare(ctx,t,s.a?1.0:0.65);else playSnare(ctx,t,0.12)
    if(f.s==='k')playKick(ctx,t,0.9)
    if(f.s==='h')playHihat(ctx,t,0.55)
    playClick(ctx,t,idx===0)
    setTimeout(()=>setActiveBeat(idx),Math.max(0,(t-ctx.currentTime)*1000))
  },[])
  const sched=useCallback(()=>{
    if(!on.current)return
    const ctx=ctxRef.current,iv=60/bpmR.current
    while(nextT.current<ctx.currentTime+0.25){fire(ctx,beat.current,nextT.current);nextT.current+=iv;beat.current++}
    timerRef.current=setTimeout(sched,30)
  },[fire])
  const start=useCallback(()=>{
    const ctx=getCtx(ctxRef);beat.current=0;nextT.current=ctx.currentTime+0.05
    on.current=true;setPlaying(true);sched()
  },[sched])
  const stop=useCallback(()=>{
    on.current=false;setPlaying(false);setActiveBeat(-1)
    if(timerRef.current)clearTimeout(timerRef.current)
  },[])
  const setBpm=useCallback((v)=>{setBpmS(v);bpmR.current=v},[])
  useEffect(()=>()=>{on.current=false;if(timerRef.current)clearTimeout(timerRef.current)},[])
  return{bpm,setBpm,playing,activeBeat,start,stop}
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Stars({count,size=16}){
  return <span>{[1,2,3].map(i=><span key={i} style={{fontSize:size,filter:i<=count?'none':'grayscale(1) opacity(0.25)'}}>⭐</span>)}</span>
}

function Visualizer({rudiment,activeBeat,playing}){
  const{seq,feet,color}=rudiment
  return(
    <div style={{marginTop:14}}>
      <div style={{fontSize:10,color:'#64748B',fontWeight:700,letterSpacing:'0.12em',marginBottom:5}}>MÃOS</div>
      <div style={{display:'flex',gap:3,marginBottom:8}}>
        {seq.map((s,i)=>{
          const lit=playing&&activeBeat===i
          const tc=s.g?'#475569':s.h==='R'?'#60A5FA':'#F472B6'
          return(
            <div key={i} style={{flex:1,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',
              borderRadius:7,position:'relative',
              background:lit?color:s.g?'#1a2234':'#0F172A',
              border:`1.5px solid ${lit?color:s.g?'#2d3f5a':'#1E293B'}`,
              boxShadow:lit?`0 0 14px ${color}90`:'none',transition:'background 0.06s,box-shadow 0.06s'}}>
              {s.a&&!s.g&&<span style={{position:'absolute',top:1,fontSize:7,color:lit?'white':color}}>▲</span>}
              <span style={{fontSize:11,fontWeight:900,fontFamily:'monospace',color:lit?'white':tc}}>{s.l}</span>
            </div>
          )
        })}
      </div>
      <div style={{fontSize:10,color:'#64748B',fontWeight:700,letterSpacing:'0.12em',marginBottom:5}}>PÉS</div>
      <div style={{display:'flex',gap:3}}>
        {feet.map((f,i)=>{
          const lit=playing&&activeBeat===i&&!!f.s
          const fc=f.l==='BD'?'#F59E0B':'#10B981'
          return(
            <div key={i} style={{flex:1,aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',
              borderRadius:7,
              background:lit?fc:f.s?'#0F172A':'transparent',
              border:`1.5px solid ${lit?fc:f.s?'#1E293B':'transparent'}`,
              boxShadow:lit?`0 0 10px ${fc}80`:'none',transition:'background 0.06s,box-shadow 0.06s'}}>
              <span style={{fontSize:9,fontWeight:800,fontFamily:'monospace',color:lit?'#0F172A':f.s?fc:'#1E293B'}}>{f.l}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompletionModal({rudiment,bpm,stars,xpGained,sessionSecs,onClose}){
  const m=Math.floor(sessionSecs/60),s=sessionSecs%60
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
      <div style={{background:'#1E293B',borderRadius:20,padding:'28px 22px',maxWidth:340,width:'100%',textAlign:'center',border:`2px solid ${rudiment.color}50`}}>
        <div style={{fontSize:52,marginBottom:8}}>{stars===3?'🏆':stars===2?'🌟':'⭐'}</div>
        <div style={{color:'white',fontWeight:900,fontSize:20,marginBottom:4}}>
          {stars===3?'Excelente!':stars===2?'Muito bom!':'Continue assim!'}
        </div>
        <div style={{color:'#64748B',fontSize:13,marginBottom:14}}>{rudiment.name}</div>
        <Stars count={stars} size={26}/>
        <div style={{marginTop:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{background:'#0F172A',borderRadius:10,padding:'10px'}}>
            <div style={{color:'#64748B',fontSize:11}}>BPM atingido</div>
            <div style={{color:rudiment.color,fontWeight:900,fontSize:26,fontFamily:'monospace'}}>{bpm}</div>
          </div>
          <div style={{background:'#0F172A',borderRadius:10,padding:'10px'}}>
            <div style={{color:'#64748B',fontSize:11}}>Tempo</div>
            <div style={{color:'#10B981',fontWeight:900,fontSize:26,fontFamily:'monospace'}}>{m}:{String(s).padStart(2,'0')}</div>
          </div>
        </div>
        <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <span style={{fontSize:20}}>✨</span>
          <span style={{color:'#FCD34D',fontWeight:900,fontSize:20}}>+{xpGained} XP</span>
        </div>
        <button onClick={onClose} style={{marginTop:18,width:'100%',padding:'13px',borderRadius:10,
          background:rudiment.color,border:'none',color:'white',fontWeight:900,fontSize:15,cursor:'pointer'}}>
          Continuar →
        </button>
      </div>
    </div>
    
  )// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const[aluno,setAluno]=useState(null)
  const[nome,setNome]=useState('')
  const[senha,setSenha]=useState('')
  const[erro,setErro]=useState('')
  const[loading,setLoading]=useState(false)
  const[selected,setSelected]=useState(RUDIMENTS[0])
  const[tab,setTab]=useState('treinar')
  const[modal,setModal]=useState(null)
  const[toasts,setToasts]=useState([])
  const[sessionSecs,setSessionSecs]=useState(0)
  const sessionRef=useRef(null),secsRef=useRef(0)
  const engine=useEngine(selected)

  const showToast=useCallback((msg,color='#3B82F6')=>{
    const id=Date.now()+Math.random()
    setToasts(t=>[...t,{id,msg,color}])
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200)
  },[])

  useEffect(()=>{
    if(engine.playing){
      secsRef.current=0;setSessionSecs(0)
      sessionRef.current=setInterval(()=>{secsRef.current++;setSessionSecs(secsRef.current)},1000)
    }else{if(sessionRef.current)clearInterval(sessionRef.current)}
    return()=>{if(sessionRef.current)clearInterval(sessionRef.current)}
  },[engine.playing])

  const entrar=async()=>{
    if(!nome.trim()||!senha.trim())return
    setLoading(true);setErro('')
    const{data}=await supabase.from('alunos').select('*').eq('name',nome.trim()).eq('senha',senha.trim()).single()
    if(data){setAluno(data)}else{setErro('Nome ou senha incorretos.')}
    setLoading(false)
  }

  const cadastrar=async()=>{
    if(!nome.trim()||!senha.trim())return
    setLoading(true);setErro('')
    const{data}=await supabase.from('alunos').insert([{name:nome.trim(),senha:senha.trim()}]).select().single()
    if(data){setAluno(data)}else{setErro('Esse nome já existe. Tente outro.')}
    setLoading(false)
  }

  const salvar=async(updates)=>{
    if(!aluno)return
    const{data}=await supabase.from('alunos').update(updates).eq('id',aluno.id).select().single()
    if(data)setAluno(data)
  }

  const handleStop=()=>{
    engine.stop()
    const elapsed=secsRef.current
    if(elapsed<5)return
    const stars=calcStars(engine.bpm,selected.bpm)
    const xpGained=Math.round(selected.xpReward*(stars===3?1.0:stars===2?0.6:0.3))
    const newStars={...(aluno.stars||{}),[selected.id]:Math.max((aluno.stars||{})[selected.id]||0,stars)}
    const newXP=(aluno.xp||0)+xpGained
    const newMins=(aluno.total_minutes||0)+Math.floor(elapsed/60)
    const newDays=[...new Set([...(aluno.practice_days||[]),todayStr()])]
    const newUnlocked=[...(aluno.unlocked||['single'])]
    const next=RUDIMENTS.find(r=>r.order===selected.order+1)
    if(next&&!newUnlocked.includes(next.id)&&stars>=1){
      newUnlocked.push(next.id)
      setTimeout(()=>showToast(`🔓 Desbloqueado: ${next.name}!`,next.color),1800)
    }
    salvar({xp:newXP,stars:newStars,unlocked:newUnlocked,practice_days:newDays,total_minutes:newMins})
    setModal({stars,xpGained,sessionSecs:elapsed})
  }

  const lv=getLevel(aluno?.xp||0)

  if(!aluno) return(
    <div style={{minHeight:'100vh',background:'#0F172A',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{maxWidth:340,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:16}}>🥁</div>
        <div style={{color:'white',fontWeight:900,fontSize:22,marginBottom:4}}>Drum Training</div>
        <div style={{color:'#64748B',fontSize:13,marginBottom:32}}>Ministério de Louvor Rendição</div>
        {erro&&<div style={{background:'#EF444420',border:'1px solid #EF4444',borderRadius:8,padding:'10px',marginBottom:16,color:'#EF4444',fontSize:13}}>{erro}</div>}
        <input value={nome} onChange={e=>setNome(e.target.value)} placeholder='Seu nome...' maxLength={30}
          style={{width:'100%',padding:'14px',borderRadius:10,border:'2px solid #334155',background:'#1E293B',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',marginBottom:10,textAlign:'center'}}/>
        <input value={senha} onChange={e=>setSenha(e.target.value)} placeholder='Senha...' type='password' maxLength={20}
          style={{width:'100%',padding:'14px',borderRadius:10,border:'2px solid #334155',background:'#1E293B',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',marginBottom:16,textAlign:'center'}}/>
        <button onClick={entrar} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:'#3B82F6',color:'white',fontWeight:900,fontSize:15,cursor:'pointer',marginBottom:10}}>
          {loading?'Entrando...':'▶ Entrar'}
        </button>
        <button onClick={cadastrar} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:10,border:'2px solid #334155',background:'transparent',color:'#94A3B8',fontWeight:700,fontSize:14,cursor:'pointer'}}>
          Criar conta nova
        </button>
      </div>
    </div>
  )

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:'100vh',background:'#F1F5F9',maxWidth:480,margin:'0 auto'}}>
      {toasts.map(t=>(
        <div key={t.id} style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:300,background:t.color,color:'white',padding:'10px 20px',borderRadius:30,fontWeight:800,fontSize:13,boxShadow:'0 4px 20px rgba(0,0,0,0.35)',whiteSpace:'nowrap',maxWidth:'88vw',textAlign:'center'}}>
          {t.msg}
        </div>
      ))}
      {modal&&<CompletionModal rudiment={selected} bpm={engine.bpm} stars={modal.stars} xpGained={modal.xpGained} sessionSecs={modal.sessionSecs} onClose={()=>setModal(null)}/>}

      <div style={{background:'linear-gradient(135deg,#0F172A,#1E293B)',padding:'14px 16px 10px',position:'sticky',top:0,zIndex:10,borderBottom:'1px solid #334155'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>🥁</span>
            <div>
              <div style={{color:'white',fontWeight:900,fontSize:14}}>Olá, {aluno.name}!</div>
              <div style={{color:'#475569',fontSize:10}}>Ministério de Louvor Rendição</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,background:'#1E293B',borderRadius:20,padding:'4px 10px'}}>
            <span style={{fontSize:14}}>{lv.icon}</span>
            <span style={{color:'#FCD34D',fontWeight:900,fontSize:13}}>{aluno.xp||0} XP</span>
          </div>
        </div>
        <div style={{background:'#1E293B',borderRadius:99,height:4,overflow:'hidden'}}>
          <div style={{width:`${lv.prog}%`,height:'100%',background:'linear-gradient(90deg,#3B82F6,#8B5CF6)',borderRadius:99,transition:'width 0.5s'}}/>
        </div>
      </div>

      <div style={{display:'flex',background:'white',borderBottom:'2px solid #E2E8F0'}}>
        {[['treinar','🎯','Treinar'],['rudimentos','🥁','Rudimentos'],['perfil','👤','Perfil']].map(([id,ico,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 4px',border:'none',borderBottom:tab===id?'3px solid #3B82F6':'3px solid transparent',background:'white',color:tab===id?'#3B82F6':'#94A3B8',fontWeight:700,fontSize:11,cursor:'pointer'}}>
            <div style={{fontSize:16}}>{ico}</div><div style={{marginTop:1}}>{label}</div>
          </button>
        ))}
      </div>

      <div style={{padding:14}}>
        {tab==='treinar'&&(
          <>
            <div style={{background:'white',borderRadius:14,padding:'16px',border:`2px solid ${selected.color}25`,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:17,color:'#0F172A'}}>{selected.name}</div>
                  <div style={{fontSize:12,color:'#64748B',marginTop:2}}>{selected.desc}</div>
                </div>
                <div style={{background:selected.color,color:'white',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20,marginLeft:8}}>F{selected.phase}</div>
              </div>
              <div style={{marginTop:10,background:'#F8FAFC',borderRadius:8,padding:'9px 12px',border:'1px solid #E2E8F0',fontSize:12,color:'#475569',lineHeight:1.6}}>
                💡 {selected.tip}
              </div>
              <Visualizer rudiment={selected} activeBeat={engine.activeBeat} playing={engine.playing}/>
            </div>

            <div style={{background:'#0F172A',borderRadius:14,padding:'14px',border:'1px solid #1E293B'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{color:'#94A3B8',fontWeight:800,fontSize:10,letterSpacing:'0.1em'}}>⏱ METRÔNOMO</div>
                <div style={{fontFamily:'monospace',fontSize:20,color:engine.playing?'#EF4444':'#475569',fontWeight:900}}>
                  {String(Math.floor(sessionSecs/60)).padStart(2,'0')}:{String(sessionSecs%60).padStart(2,'0')}
                </div>
              </div>
              <div style={{textAlign:'center',marginBottom:8}}>
                <span style={{fontSize:44,fontWeight:900,color:selected.color,fontFamily:'monospace'}}>{engine.bpm}</span>
                <span style={{color:'#475569',fontSize:12,marginLeft:5}}>BPM</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                {[1,2,3].map(s=>{
                  const needed=s===1?selected.bpm[0]+(selected.bpm[1]-selected.bpm[0])*0.1:s===2?selected.bpm[0]+(selected.bpm[1]-selected.bpm[0])*0.5:selected.bpm[0]+(selected.bpm[1]-selected.bpm[0])*0.85
                  return(<div key={s} style={{flex:1,textAlign:'center',opacity:engine.bpm>=needed?1:0.3}}>
                    <div style={{fontSize:14}}>⭐</div>
                    <div style={{fontSize:8,color:engine.bpm>=needed?'#FCD34D':'#475569',fontWeight:700}}>{Math.round(needed)}</div>
                  </div>)
                })}
              </div>
              <input type='range' min={40} max={200} value={engine.bpm}
                onChange={e=>{if(engine.playing)engine.stop();engine.setBpm(Number(e.target.value))}}
                style={{width:'100%',accentColor:selected.color,cursor:'pointer',marginBottom:8}}/>
              <div style={{display:'flex',gap:5,justifyContent:'center',marginBottom:10}}>
                {[60,80,100,120].map(v=>(
                  <button key={v} onClick={()=>{if(engine.playing)engine.stop();engine.setBpm(v)}} style={{padding:'4px 10px',borderRadius:6,border:`1.5px solid ${engine.bpm===v?selected.color:'#334155'}`,background:engine.bpm===v?selected.color+'25':'transparent',color:engine.bpm===v?selected.color:'#64748B',fontSize:11,fontWeight:700,cursor:'pointer'}}>{v}</button>
                ))}
              </div>
              <button onClick={()=>engine.playing?handleStop():engine.start()} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:engine.playing?'#EF4444':selected.color,color:'white',fontSize:14,fontWeight:900,cursor:'pointer',boxShadow:engine.playing?'0 0 18px #EF444450':`0 0 18px ${selected.color}50`,transition:'all 0.2s'}}>
                {engine.playing?'⏹ PARAR + AVALIAR':'▶ INICIAR SESSÃO'}
              </button>
            </div>
          </>
        )}

        {tab==='rudimentos'&&(
          <>
            <div style={{fontSize:12,color:'#94A3B8',marginBottom:12}}>{(aluno.unlocked||['single']).length} de {RUDIMENTS.length} desbloqueados</div>
            {RUDIMENTS.map(r=>{
              const unlocked=(aluno.unlocked||['single']).includes(r.id)
              const myStars=(aluno.stars||{})[r.id]||0
              return(
                <button key={r.id} onClick={()=>{if(unlocked){engine.stop();setSelected(r);engine.setBpm(Math.round((r.bpm[0]+r.bpm[1])/2));setTab('treinar')}}} style={{width:'100%',textAlign:'left',padding:'13px 14px',background:selected?.id===r.id?r.color+'12':unlocked?'white':'#F8FAFC',border:`2px solid ${selected?.id===r.id?r.color:unlocked?'#E2E8F0':'#E2E8F0'}`,borderRadius:10,marginBottom:8,cursor:unlocked?'pointer':'not-allowed',opacity:unlocked?1:0.45,transition:'all 0.15s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:20}}>{unlocked?(myStars>0?'🥁':'🎵'):'🔒'}</span>
                      <div>
                        <div style={{fontWeight:800,fontSize:13,color:'#0F172A'}}>{r.name}</div>
                        <div style={{fontSize:11,color:'#64748B'}}>{r.desc}</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{background:r.color+'20',color:r.color,fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:20,marginBottom:3}}>F{r.phase}</div>
                      {myStars>0&&<Stars count={myStars} size={12}/>}
                    </div>
                  </div>
                  {unlocked&&<div style={{marginTop:8,background:'#F1F5F9',borderRadius:6,height:4,overflow:'hidden'}}><div style={{width:`${myStars===3?100:myStars===2?66:myStars===1?33:0}%`,height:'100%',background:r.color,borderRadius:6}}/></div>}
                </button>
              )
            })}
          </>
        )}

        {tab==='perfil'&&(
          <>
            <div style={{background:'#0F172A',borderRadius:14,padding:'16px',marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:28}}>{lv.icon}</span>
                  <div>
                    <div style={{color:'white',fontWeight:900,fontSize:16}}>{aluno.name}</div>
                    <div style={{color:'#64748B',fontSize:11}}>{lv.title} · Nível {lv.idx+1}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#FCD34D',fontWeight:900,fontSize:20}}>{aluno.xp||0} XP</div>
                  {lv.next&&<div style={{color:'#475569',fontSize:11}}>próx: {lv.next.min}</div>}
                </div>
              </div>
              <div style={{background:'#1E293B',borderRadius:99,height:8,overflow:'hidden'}}>
                <div style={{width:`${lv.prog}%`,height:'100%',background:'linear-gradient(90deg,#3B82F6,#8B5CF6)',borderRadius:99,transition:'width 0.5s'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[
                {label:'Rudimentos',value:`${(aluno.unlocked||['single']).length}/${RUDIMENTS.length}`,icon:'🥁'},
                {label:'Minutos',value:aluno.total_minutes||0,icon:'⏱'},
                {label:'Dias ativos',value:(aluno.practice_days||[]).length,icon:'📅'},
                {label:'XP Total',value:aluno.xp||0,icon:'✨'},
              ].map(s=>(
                <div key={s.label} style={{background:'white',borderRadius:12,padding:'12px',border:'1px solid #E2E8F0',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:3}}>{s.icon}</div>
                  <div style={{fontWeight:900,fontSize:18,color:'#0F172A'}}>{s.value}</div>
                  <div style={{fontSize:11,color:'#94A3B8'}}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setAluno(null)} style={{width:'100%',padding:'11px',borderRadius:10,border:'2px solid #334155',background:'transparent',color:'#64748B',fontWeight:700,fontSize:13,cursor:'pointer'}}>
              Sair da conta
            </button>
          </>
        )}
      </div>
    </div>
  )
        }
    }
