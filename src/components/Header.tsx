import { useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import Brand from './Brand'
import MotionToggle from './MotionToggle'

export default function Header() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  return <header className="site-header" onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() }
  }}>
    <div className="container header-inner">
      <Brand />
      <MotionToggle />
      <button className="menu-toggle" ref={menuButton} aria-expanded={open} aria-controls="principal" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="principal" className={`navigation${open ? ' navigation-open' : ''}`} aria-label="Principal">
        <a href="#vazamentos" onClick={() => setOpen(false)}>Vazamentos</a>
        <a href="#solucoes" onClick={() => setOpen(false)}>O que protegemos</a>
        <a href="#como-funciona" onClick={() => setOpen(false)}>Como funciona</a>
        <a href="#duvidas" onClick={() => setOpen(false)}>Dúvidas</a>
        <a className="button header-cta" href="#formulario" onClick={() => setOpen(false)}>Diagnóstico gratuito <ArrowUpRight size={17} aria-hidden="true" /></a>
      </nav>
    </div>
  </header>
}
