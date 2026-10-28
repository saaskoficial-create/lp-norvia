import { ArrowUpRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { questions } from '../content'

export default function FAQ() {
  return <section className="section faq-section" aria-labelledby="faq-title"><div className="container faq-grid"><div><p className="section-kicker">Sem deixar pontas soltas</p><h2 id="faq-title">Antes de seguir,<br /><span>tire suas dúvidas.</span></h2><p className="faq-intro">Você pode começar por aqui.<br />Ou conversar direto com a gente.</p><a className="text-link" href="https://wa.me/5511996197517" target="_blank" rel="noreferrer">Falar com a Norvia <ArrowUpRight size={18} aria-hidden="true" /></a></div><Accordion className="faq-accordion">{questions.map((faq, i) => <AccordionItem value={`q${i}`} key={faq.question}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent><p>{faq.answer}</p></AccordionContent></AccordionItem>)}</Accordion></div></section>
}
