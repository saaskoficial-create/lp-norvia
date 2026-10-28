import { ArrowDown, ArrowUpRight, Check, ShieldCheck, Truck, Route, Clock3, FileCheck2, LockKeyhole, DatabaseBackup } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import OperationExplorer from './OperationExplorer'
import ProcessStory from './ProcessStory'
import { coverage } from '../content'

const LeadForm = lazy(() => import('./LeadForm'))

function DeferredLeadForm() {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!host.current || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '1600px 0px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  const fallback = <p className="deferred-form-note" role="status">Preparando formulário…</p>
  return <div className="lead-form-shell" ref={host}>{visible ? <Suspense fallback={fallback}><LeadForm /></Suspense> : fallback}</div>
}

export function Hero() {
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <picture className="hero-backdrop"><source type="image/webp" srcSet="/images/truck-720.webp 720w, /images/truck-1400.webp 1400w" sizes="100vw" /><img src="/images/truck-highway.jpg" alt="" width="1400" height="1867" fetchPriority="high" /></picture>
      <div className="hero-grid-pattern" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-content">
        <div className="hero-intro"><ShieldCheck size={15} aria-hidden="true" /> Feito para transportadoras</div>
        <h1 id="hero-title"><span className="hero-title-line"><span>Sua operação segura.</span></span>{' '}<span className="hero-title-line"><span className="hero-title-accent">Sua frota em movimento.</span></span></h1>
        <p className="hero-description">O próximo frete não pode esperar o sistema voltar.<br className="desktop-break" /> Cuide dos acessos, dos dados e dos sistemas que fazem a sua transportadora seguir.</p>
        <a href="#formulario" className="button hero-cta">Solicitar diagnóstico gratuito <ArrowUpRight size={20} aria-hidden="true" /></a>
        <p className="hero-reassurance"><Check size={14} aria-hidden="true" /> Sem custo. Sem compromisso de contratação.</p>
        <div className="hero-circuit" aria-label="Três pilares da continuidade operacional">
          <div className="circuit-heading"><span className="circuit-rule" /><div className="circuit-shield"><ShieldCheck size={38} strokeWidth={1.3} aria-hidden="true" /></div><span className="circuit-rule" /></div>
          <div className="circuit-items">
            <div><LockKeyhole aria-hidden="true" /><p><strong>Acessos</strong><span>Quem pode entrar.</span></p></div>
            <div><DatabaseBackup aria-hidden="true" /><p><strong>Informação</strong><span>O que precisa voltar.</span></p></div>
            <div><Truck aria-hidden="true" /><p><strong>Operação</strong><span>O que precisa rodar.</span></p></div>
          </div>
        </div>
        <a className="hero-scroll" href="#problema" aria-label="Conhecer os riscos da operação"><ArrowDown size={17} aria-hidden="true" /></a>
      </div>
    </section>
    <div className="trust-strip"><div className="container trust-inner">
      <span><Truck aria-hidden="true" /> Transporte rodoviário de cargas</span>
      <span><Route aria-hidden="true" /> Segurança com contexto operacional</span>
      <span><ShieldCheck aria-hidden="true" /> Diagnóstico inicial gratuito</span>
    </div></div>
  </>
}

export function Problems() {
  return <section id="problema" className="section problem-section" aria-labelledby="problem-title"><div className="container problem-grid">
    <div className="problem-visual"><img src="/images/context-logistics.webp" alt="Operador de logística utilizando um coletor de dados em um armazém" width="1400" height="933" loading="lazy" /><div className="image-caption"><span className="caption-symbol"><Clock3 size={22} aria-hidden="true" /></span><p>O sistema parou.<br /><strong>A operação sentiu.</strong></p></div><span className="stock-caption">Imagem ilustrativa de contexto logístico.</span></div>
    <div className="problem-copy"><p className="section-kicker">Do digital para a vida real</p><h2 id="problem-title">Quando o sistema trava,<br /><span>o prejuízo sai do pátio.</span></h2><p className="section-lead">A carga está pronta. O motorista também. Mas um único ponto de falha pode segurar a próxima entrega.</p><div className="impact-list">
      <article><FileCheck2 aria-hidden="true" /><div><h3>Emissão travada, caminhão parado.</h3><p>Sem CT-e ou MDF-e, a frota espera enquanto os custos continuam.</p></div></article>
      <article><DatabaseBackup aria-hidden="true" /><div><h3>Backup existe. Mas ele volta?</h3><p>Uma cópia sem restauração testada deixa a retomada em dúvida.</p></div></article>
      <article><LockKeyhole aria-hidden="true" /><div><h3>Um acesso esquecido. Um risco aberto.</h3><p>Credenciais expostas e permissões antigas podem abrir portas indevidas.</p></div></article>
    </div><a className="text-link" href="#solucoes">Olhar para os pontos críticos <ArrowUpRight size={18} aria-hidden="true" /></a></div>
  </div></section>
}

export function Coverage() {
  return <section id="solucoes" className="section coverage-section" aria-labelledby="coverage-title"><div className="container">
    <div className="section-heading centered"><p className="section-kicker">Segurança que entende a estrada</p><h2 id="coverage-title">Os sistemas se conectam.<br /><span>O cuidado também.</span></h2><p className="section-lead">Não olhamos só para uma senha ou um servidor.<br className="desktop-break" /> Olhamos para o que sustenta o seu próximo frete.</p></div>
    <OperationExplorer />
    <div className="coverage-grid">{coverage.map(({ icon: Icon, title, text }, index) => <article key={title} className={`coverage-item coverage-item-${index}`}>
      <div className="feature-icon"><Icon size={25} strokeWidth={1.5} aria-hidden="true" /></div><div className="feature-copy"><h3>{title}</h3><p>{text}</p></div>
      {index === 0 && <div className="document-art" aria-hidden="true"><FileCheck2 size={35} strokeWidth={1.2} /><div><b>CT-e / MDF-e</b><span>Certificados digitais</span><i /><i /></div><div className="doc-seal"><ShieldCheck size={20} /></div></div>}
      {index === 1 && <div className="radar-art" aria-hidden="true"><i /><i /><i /><Route size={38} strokeWidth={1.2} /></div>}
      {index === 5 && <div className="network-art" aria-hidden="true"><div><LockKeyhole /></div><span /><div><ShieldCheck /></div><span /><div><Truck /></div></div>}
    </article>)}</div>
    <details className="coverage-details"><summary><span>Ver todas as frentes de proteção</span><ArrowDown size={17} aria-hidden="true" /></summary><div className="coverage-details-body">{coverage.map(({ icon: Icon, title, text }) => <article key={title} className="coverage-detail-row"><Icon size={20} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></details>
  </div></section>
}

export function Process() {
  return <ProcessStory />
}

export function Statement() {
  return <section className="statement-section" aria-labelledby="statement-title"><img src="/images/context-highway.webp" alt="Caminhão de carga em uma rodovia aberta durante o dia" width="1400" height="1050" loading="lazy" /><div className="container statement-content"><p className="section-kicker">Por trás de cada entrega</p><h2 id="statement-title">A estrada continua.<br /><span>O cuidado também.</span></h2><p>Seu negócio depende de muita coisa funcionando ao mesmo tempo. É para esse cenário que a Norvia trabalha.</p><a className="button" href="#formulario">Conhecer os riscos da minha operação <ArrowUpRight size={20} aria-hidden="true" /></a></div></section>
}

export function Diagnosis() {
  return <section id="formulario" className="section diagnosis-section" aria-labelledby="diagnosis-title"><div className="container diagnosis-grid">
    <div className="diagnosis-copy"><div className="diagnosis-symbol"><ShieldCheck size={39} strokeWidth={1.3} aria-hidden="true" /></div><p className="section-kicker">Seu primeiro passo</p><h2 id="diagnosis-title">Antes da próxima parada,<br /><span>conheça os seus riscos.</span></h2><p>Solicite seu diagnóstico gratuito. A equipe da Norvia entra em contato para entender a sua operação e alinhar a primeira avaliação.</p><ul className="diagnosis-benefits"><li><Check aria-hidden="true" />Um olhar para a exposição digital da sua empresa</li><li><Check aria-hidden="true" />Foco na realidade de uma transportadora</li><li><Check aria-hidden="true" />Clareza para decidir os próximos passos</li></ul><div className="diagnosis-scope"><LockKeyhole size={19} aria-hidden="true" /><p>O levantamento inicial utiliza informações públicas. Qualquer acesso a sistemas internos exige autorização específica.</p></div></div>
    <div className="form-panel"><div className="form-panel-heading"><span className="form-tag"><span /> Diagnóstico gratuito</span><h3>Vamos olhar para<br />a sua operação?</h3><p>Conte um pouco sobre a sua transportadora.</p></div><DeferredLeadForm /></div>
  </div></section>
}

