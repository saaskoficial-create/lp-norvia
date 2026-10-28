import { useState } from 'react'
import { ArrowUpRight, FileCheck2, KeyRound, Radar, DatabaseBackup, Network, ShieldCheck } from 'lucide-react'

const points = [
  {icon:FileCheck2,label:'Emissão',title:'O frete começa antes da estrada.',text:'Certificados e sistemas de CT-e e MDF-e fazem parte do caminho crítico da sua transportadora.',look:'Certificados digitais e dependências da emissão fiscal.'},
  {icon:Radar,label:'Rastreamento',title:'Visibilidade para a carga seguir.',text:'Rastreamento e gestão precisam conversar com a operação, sem dependências invisíveis.',look:'Sistemas de rastreamento, ERP e seus pontos de conexão.'},
  {icon:KeyRound,label:'Acessos',title:'Cada acesso tem uma responsabilidade.',text:'Colaboradores, motoristas e fornecedores precisam das permissões certas, no momento certo.',look:'Permissões, acessos antigos e exposição de credenciais.'},
  {icon:DatabaseBackup,label:'Backup',title:'Recuperar precisa fazer parte do plano.',text:'Quando algo falha, saber o que restaurar e como retomar faz diferença para a continuidade.',look:'Cópias de segurança, restauração e procedimentos de retomada.'},
  {icon:Network,label:'Terceiros',title:'O risco também cruza outras empresas.',text:'Fornecedores conectados fazem parte da mesma cadeia. Os acessos deles também precisam entrar no mapa.',look:'Dependências e acessos de prestadores e parceiros.'},
]

export default function OperationExplorer() {
  const [active, setActive] = useState(0)
  const point=points[active]
  const Icon=point.icon
  return <div className="operation-explorer">
    <div className="explorer-topline"><span><ShieldCheck size={16} aria-hidden="true" /> A sua operação, vista como um todo</span><span className="explorer-hint">Selecione um ponto</span></div>
    <div className="operation-nodes" role="group" aria-label="Pontos críticos da operação">{points.map(({icon:NodeIcon,label},index)=><button key={label} type="button" className={`operation-node${active===index?' operation-node-active':''}`} aria-pressed={active===index} aria-controls="operation-detail" onClick={()=>setActive(index)}><span><NodeIcon size={26} strokeWidth={1.4} aria-hidden="true" /></span><strong>{label}</strong></button>)}</div>
    <div id="operation-detail" className="operation-detail" aria-live="polite" aria-atomic="true"><div className="detail-symbol"><Icon size={36} strokeWidth={1.3} aria-hidden="true" /></div><div className="detail-copy" key={point.label}><h3>{point.title}</h3><p>{point.text}</p></div><div className="detail-focus"><span>O que olhamos</span><p>{point.look}</p><a href="#formulario">Quero entender meus riscos <ArrowUpRight size={16} aria-hidden="true" /></a></div></div>
    <p className="explorer-caption">Representação dos pontos de atenção da operação. O diagnóstico considera a estrutura da sua empresa.</p>
  </div>
}
