import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export default function App() {
  const [aluno, setAluno] = useState(null)
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const entrar = async () => {
    if (!nome.trim() || !senha.trim()) return
    setLoading(true)
    setErro('')
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('name', nome.trim())
      .eq('senha', senha.trim())
      .single()
    if (data) {
      setAluno(data)
    } else {
      setErro('Nome ou senha incorretos.')
    }
    setLoading(false)
  }

  const cadastrar = async () => {
    if (!nome.trim() || !senha.trim()) return
    setLoading(true)
    setErro('')
    const { data, error } = await supabase
      .from('alunos')
      .insert([{ name: nome.trim(), senha: senha.trim() }])
      .select()
      .single()
    if (data) {
      setAluno(data)
    } else {
      setErro('Esse nome já existe. Tente outro.')
    }
    setLoading(false)
  }

  if (!aluno) return (
    <div style={{
      minHeight:'100vh', background:'#0F172A',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24
    }}>
      <div style={{ maxWidth:340, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🥁</div>
        <div style={{ color:'white', fontWeight:900, fontSize:22, marginBottom:4 }}>
          Drum Training
        </div>
        <div style={{ color:'#64748B', fontSize:13, marginBottom:32 }}>
          Ministério de Louvor Rendição
        </div>
        {erro && (
          <div style={{ background:'#EF444420', border:'1px solid #EF4444', borderRadius:8,
            padding:'10px', marginBottom:16, color:'#EF4444', fontSize:13 }}>
            {erro}
          </div>
        )}
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Seu nome..." maxLength={30}
          style={{ width:'100%', padding:'14px', borderRadius:10, border:'2px solid #334155',
            background:'#1E293B', color:'white', fontSize:15, outline:'none',
            boxSizing:'border-box', marginBottom:10, textAlign:'center' }} />
        <input value={senha} onChange={e => setSenha(e.target.value)}
          placeholder="Senha..." type="password" maxLength={20}
          style={{ width:'100%', padding:'14px', borderRadius:10, border:'2px solid #334155',
            background:'#1E293B', color:'white', fontSize:15, outline:'none',
            boxSizing:'border-box', marginBottom:16, textAlign:'center' }} />
        <button onClick={entrar} disabled={loading} style={{
          width:'100%', padding:'14px', borderRadius:10, border:'none',
          background:'#3B82F6', color:'white', fontWeight:900, fontSize:15,
          cursor:'pointer', marginBottom:10 }}>
          {loading ? 'Entrando...' : '▶ Entrar'}
        </button>
        <button onClick={cadastrar} disabled={loading} style={{
          width:'100%', padding:'14px', borderRadius:10, border:'2px solid #334155',
          background:'transparent', color:'#94A3B8', fontWeight:700, fontSize:14,
          cursor:'pointer' }}>
          Criar conta nova
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0F172A',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🥁</div>
        <div style={{ fontWeight:900, fontSize:22, marginBottom:8 }}>
          Olá, {aluno.name}!
        </div>
        <div style={{ color:'#64748B', fontSize:14, marginBottom:24 }}>
          Conectado com sucesso ao banco de dados!
        </div>
        <div style={{ background:'#1E293B', borderRadius:12, padding:'16px', marginBottom:16 }}>
          <div style={{ color:'#FCD34D', fontWeight:800, fontSize:13 }}>✅ Supabase conectado</div>
          <div style={{ color:'#64748B', fontSize:12, marginTop:4 }}>XP: {aluno.xp} · Nível ativo</div>
        </div>
        <button onClick={() => setAluno(null)} style={{
          padding:'10px 24px', borderRadius:8, border:'1px solid #334155',
          background:'transparent', color:'#64748B', cursor:'pointer', fontSize:13 }}>
          Sair
        </button>
      </div>
    </div>
  )
    }
