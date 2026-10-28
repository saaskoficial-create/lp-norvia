import { ArrowUpRight } from 'lucide-react'
import Brand from './Brand'
const year = new Date().getFullYear()

export default function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-top"><div><Brand footer /><p>Segurança digital para transportadoras.<br />Continuidade para a sua operação.</p></div><div className="footer-contact"><span>Converse com a Norvia</span><a href="mailto:empresa@norviasecurity.com.br">empresa@norviasecurity.com.br <ArrowUpRight size={16} aria-hidden="true" /></a><a href="https://wa.me/5511996197517" target="_blank" rel="noreferrer">(11) 99619-7517 <ArrowUpRight size={16} aria-hidden="true" /></a></div></div><div className="footer-bottom"><span>© {year} Norvia Security</span><span>CNPJ 68.755.047/0001-07</span><a href="https://www.norviasecurity.com.br/privacidade.html" target="_blank" rel="noreferrer">Política de privacidade</a></div></div></footer>
}
