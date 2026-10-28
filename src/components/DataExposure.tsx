import { ArrowDown, ArrowUpRight, Database, KeyRound, RefreshCcw, ShieldAlert } from 'lucide-react'
import './DataExposure.css'

function ExposureDetails() {
  return <div className="exposure-editorial">
    <p><strong>Senhas, mensagens e permissões.</strong> Credenciais expostas e tentativas de phishing podem transformar um acesso de rotina em um ponto de entrada.</p>
    <p><strong>Clientes, rotas e documentos.</strong> Informações sensíveis fazem parte da operação. O acesso indevido pode comprometer sua confidencialidade e disponibilidade.</p>
    <p><strong>Segurança para seguir operando.</strong> Gestão de acessos, cuidado com credenciais e recuperação de informações ajudam a reduzir o risco de uma interrupção.</p>
  </div>
}

export default function DataExposure() {
  return <section id="vazamentos" className="section data-exposure" aria-labelledby="exposure-heading">
    <div className="container exposure-layout">
      <div className="exposure-copy">
        <p className="section-kicker">Vazamentos de dados e acessos indevidos</p>
        <h2 id="exposure-heading">Um dado exposto.<br /><span>Uma operação em risco.</span></h2>
        <p className="exposure-intro">Uma credencial exposta pode abrir caminho para acessos indevidos. Na transportadora, o impacto pode chegar aos dados que sustentam cada entrega.</p>
        <div className="exposure-details-desktop"><ExposureDetails /></div>
        <details className="exposure-details-mobile"><summary>O que pode estar em risco? <ArrowDown size={16} aria-hidden="true" /></summary><ExposureDetails /></details>
        <a className="text-link exposure-cta" href="#formulario">Solicitar diagnóstico gratuito <ArrowUpRight size={17} aria-hidden="true" /></a>
      </div>

      <figure className="exposure-figure" aria-labelledby="exposure-diagram-title" aria-describedby="exposure-diagram-caption">
        <div className="exposure-figure-heading">
          <span className="exposure-diagram-symbol" aria-hidden="true"><ShieldAlert size={17} /></span>
          <p id="exposure-diagram-title">Como um risco pode se espalhar</p>
        </div>
        <div className="exposure-map">
          <div className="exposure-map-grid" aria-hidden="true" />
          <svg className="exposure-connections" viewBox="0 0 560 500" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="exposure-route-amber" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#A76D26" stopOpacity=".45" />
                <stop offset="1" stopColor="#F6BA68" />
              </linearGradient>
            </defs>
            <path className="exposure-route-track" d="M218 143 V159 Q218 170 231 170 H320 Q333 170 333 183 V195" />
            <path className="exposure-route-track" d="M342 316 V329 Q342 341 329 341 H231 Q218 341 218 353 V366" />
            <path id="leak-credential-route" data-leak-path d="M218 143 V159 Q218 170 231 170 H320 Q333 170 333 183 V195" />
            <path id="leak-operation-route" data-leak-path d="M342 316 V329 Q342 341 329 341 H231 Q218 341 218 353 V366" />
            <circle className="exposure-packet" data-leak-packet data-leak-route="leak-credential-route" cx="218" cy="143" r="3.5" />
            <circle className="exposure-packet" data-leak-packet data-leak-route="leak-operation-route" cx="342" cy="316" r="3.5" />
          </svg>

          <div className="exposure-flow-node exposure-flow-node-entry" data-leak-node>
            <span className="exposure-node-icon" aria-hidden="true"><KeyRound size={23} strokeWidth={1.5} /></span>
            <div><span className="exposure-node-eyebrow">Um possível ponto de entrada</span><h3>Credencial exposta</h3><p>Uma senha fora do ambiente protegido.</p></div>
            <span className="exposure-step" aria-hidden="true">01</span>
          </div>
          <div className="exposure-flow-node exposure-flow-node-access" data-leak-node>
            <span className="exposure-node-icon" aria-hidden="true"><Database size={23} strokeWidth={1.5} /></span>
            <div><span className="exposure-node-eyebrow">Informações sensíveis</span><h3>Acesso indevido</h3><p>Dados de clientes, rotas e documentos.</p></div>
            <span className="exposure-step" aria-hidden="true">02</span>
          </div>
          <div className="exposure-flow-node exposure-flow-node-impact" data-leak-node>
            <span className="exposure-node-icon" aria-hidden="true"><ShieldAlert size={23} strokeWidth={1.5} /></span>
            <div><span className="exposure-node-eyebrow">Risco para a continuidade</span><h3>Operação em risco</h3><p>Sistemas e informações indisponíveis.</p></div>
            <span className="exposure-step" aria-hidden="true">03</span>
          </div>
        </div>
        <figcaption id="exposure-diagram-caption" className="exposure-caption">
          <p>Ilustração conceitual de risco. Não representa uma análise ou um vazamento identificado na sua empresa.</p>
          <button type="button" data-replay-leak data-leak-replay hidden onClick={() => window.dispatchEvent(new Event('norvia:replay-exposure'))}><RefreshCcw size={13} aria-hidden="true" /> Rever sequência</button>
        </figcaption>
      </figure>
    </div>
  </section>
}
