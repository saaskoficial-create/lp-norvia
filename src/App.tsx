import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import DataExposure from './components/DataExposure'
import { Hero, Problems, Coverage, Process, Diagnosis, Statement } from './components/sections'
import { usePageMotion } from './hooks/usePageMotion'
import './App.css'

const FAQ = lazy(() => import('./components/FAQ'))

function DeferredFAQ() {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!host.current || !('IntersectionObserver' in window)) { setVisible(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: '1200px 0px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return <div id="duvidas" className="faq-shell" ref={host}>{visible && <Suspense fallback={null}><FAQ /></Suspense>}</div>
}

export default function App() {
  const root = useRef<HTMLElement>(null)
  usePageMotion(root)
  return <>
    <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
    <Header />
    <main id="conteudo" ref={root}><div id="inicio" /><Hero /><Problems /><DataExposure /><Coverage /><Process /><Statement /><Diagnosis /><DeferredFAQ /></main>
    <Footer />
  </>
}

