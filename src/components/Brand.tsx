export default function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={`brand${footer ? ' brand-light' : ''}`} href="#inicio" >
    <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 66 50 28 86 66" fill="none" stroke="currentColor" strokeWidth="17" strokeLinejoin="miter" /></svg>
    <span className="brand-wordmark"><strong>NORVIA</strong><span>SECURITY</span></span>
  </a>
}

