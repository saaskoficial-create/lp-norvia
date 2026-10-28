import { ArrowUpRight, Check, ChevronDown, Globe2, ListChecks, Radar, Search, ShieldCheck } from 'lucide-react'
import { steps } from '../content'
import './ProcessStory.css'

const phaseIcons = [Search, ListChecks, ShieldCheck, Radar]
const phaseLabels = ['Exposição pública', 'Prioridades claras', 'Ações acordadas', 'Rotina de continuidade']

function PhaseIllustration({ phase }: { phase: number }) {
  const Icon = phaseIcons[phase]
  return <div className={`process-story-art process-story-art-${phase}`}>
    <svg className="process-story-diagram" viewBox="0 0 440 270" fill="none" focusable="false">
      <defs>
        <linearGradient id={`process-phase-${phase}`} x1="60" y1="40" x2="380" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9B46B" /><stop offset="1" stopColor="#AD772D" stopOpacity=".35" />
        </linearGradient>
      </defs>
      {phase === 0 && <>
        <circle className="process-story-art-ring" cx="220" cy="135" r="98" />
        <circle className="process-story-art-ring process-story-dotted-ring" cx="220" cy="135" r="123" />
        <path className="process-story-art-route" d="M117 78 171 108M323 78 269 108M117 199 171 166M323 199 269 166" />
        <circle className="process-story-art-dot" cx="117" cy="78" r="6" /><circle className="process-story-art-dot" cx="323" cy="78" r="6" />
        <circle className="process-story-art-dot" cx="117" cy="199" r="6" /><circle className="process-story-art-dot" cx="323" cy="199" r="6" />
        <path className="process-story-art-accent" stroke={`url(#process-phase-${phase})`} d="M220 37a98 98 0 0 1 98 98" />
      </>}
      {phase === 1 && <>
        <path className="process-story-art-route" d="M92 135H129Q143 135 143 119V70Q143 56 158 56H331M143 135H331M143 135V200Q143 214 158 214H331" />
        <path className="process-story-art-accent" stroke={`url(#process-phase-${phase})`} d="M143 135H331" />
        <circle className="process-story-art-dot" cx="331" cy="56" r="5" /><circle className="process-story-art-dot" cx="331" cy="135" r="5" /><circle className="process-story-art-dot" cx="331" cy="214" r="5" />
        <rect className="process-story-art-outline" x="258" y="34" width="106" height="44" rx="12" /><rect className="process-story-art-outline" x="258" y="113" width="106" height="44" rx="12" /><rect className="process-story-art-outline" x="258" y="192" width="106" height="44" rx="12" />
        <path className="process-story-art-rule" d="M278 48H316M278 62H303M278 127H316M278 141H303M278 206H316M278 220H303" />
      </>}
      {phase === 2 && <>
        <path className="process-story-art-outline" d="m220 24 95 35v77c0 49-44 84-95 111-51-27-95-62-95-111V59z" />
        <path className="process-story-art-accent" stroke={`url(#process-phase-${phase})`} d="m220 24 95 35v77c0 49-44 84-95 111" />
        <path className="process-story-art-route" d="M59 84H125M315 84H381M65 203H147M293 203H375" />
        <rect className="process-story-art-outline" x="36" y="63" width="43" height="43" rx="11" /><rect className="process-story-art-outline" x="361" y="63" width="43" height="43" rx="11" />
        <circle className="process-story-art-dot" cx="65" cy="203" r="6" /><circle className="process-story-art-dot" cx="375" cy="203" r="6" />
      </>}
      {phase === 3 && <>
        <circle className="process-story-art-ring" cx="220" cy="135" r="73" /><circle className="process-story-art-ring" cx="220" cy="135" r="103" />
        <circle className="process-story-art-ring process-story-dotted-ring" cx="220" cy="135" r="127" />
        <path className="process-story-art-route" d="M88 135H352M220 3V267" />
        <path className="process-story-art-sector" d="M220 135V32a103 103 0 0 1 89 51z" />
        <path className="process-story-art-accent" stroke={`url(#process-phase-${phase})`} d="M220 32a103 103 0 0 1 103 103" />
        <circle className="process-story-art-dot" cx="283" cy="54" r="5" /><circle className="process-story-art-dot" cx="132" cy="190" r="5" /><circle className="process-story-art-dot" cx="303" cy="195" r="5" />
      </>}
    </svg>
    <span className="process-story-core"><Icon size={phase === 2 ? 43 : 38} strokeWidth={1.25} /></span>
    {phase === 0 && <span className="process-story-globe"><Globe2 size={18} strokeWidth={1.2} /></span>}
  </div>
}

export default function ProcessStory() {
  return <section id="como-funciona" className="section process-story" aria-labelledby="process-title">
    <div className="container">
      <div className="section-heading process-story-heading">
        <p className="section-kicker">Clareza antes de qualquer decisão</p>
        <h2 id="process-title">Do primeiro olhar<br /><span>à continuidade.</span></h2>
        <p className="section-lead">Comece pelo diagnóstico gratuito. Avance só quando fizer sentido para a sua transportadora.</p>
      </div>
      <div className="process-story-layout">
        <div className="process-story-text">
          <div className="process-story-rail" aria-hidden="true"><span data-process-line /></div>
          <ol className="process-story-list">
            {steps.map((step, index) => {
              const Icon = phaseIcons[index]
              return <li key={step.title} data-process-step data-step-index={index} className={index === 0 ? 'is-active' : undefined}>
                <div className="process-story-step-top"><span className="process-story-number">0{index + 1}</span>{index === 0 && <span className="process-story-free">Comece aqui</span>}<Icon className="process-story-mobile-icon" size={24} strokeWidth={1.4} aria-hidden="true" /></div>
                <p className="process-story-subtitle">{step.subtitle}</p>
                <h3>{step.title}.</h3>
                <p className="process-story-description">{step.text}</p>
              </li>
            })}
          </ol>
        </div>
        <div className="process-story-visual" aria-hidden="true">
          <div className="process-story-scene">
            <div className="process-story-scene-grid" />
            {steps.map((step, index) => <div className="process-story-panel" data-process-panel data-step-index={index} key={step.title}>
              <div className="process-story-panel-heading"><span>0{index + 1}</span><p>{step.subtitle}</p></div>
              <PhaseIllustration phase={index} />
              <p className="process-story-panel-label">{phaseLabels[index]}</p>
            </div>)}
          </div>
          <p className="process-story-caption">Ilustração das etapas de trabalho.</p>
        </div>
      </div>
      <div className="process-story-mobile">
        {steps.map((step, index) => <details className="process-story-disclosure" name="norvia-process" key={step.title} open={index === 0}>
          <summary>
            <span className="process-story-number">0{index + 1}</span>
            <span className="process-story-mobile-title"><strong>{step.title}.</strong><span>{step.subtitle}</span></span>
            {index === 0 && <span className="process-story-mobile-free">Comece aqui</span>}
            <ChevronDown className="process-story-chevron" size={18} aria-hidden="true" />
          </summary>
          <p>{step.text}</p>
        </details>)}
      </div>
      <div className="process-story-footer">
        <p><Check size={16} aria-hidden="true" /> Você decide como seguir. Sem contratação automática.</p>
        <a href="#formulario" className="text-link">Quero dar o primeiro passo <ArrowUpRight size={18} aria-hidden="true" /></a>
      </div>
    </div>
  </section>
}
