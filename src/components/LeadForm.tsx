import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowUpRight, CheckCircle2, LoaderCircle, LockKeyhole } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { jobRoles, leadFormSchema } from '../../shared/lead-schema'
import type { LeadFormValues } from '../../shared/lead-schema'
import './LeadForm.css'

type Availability = 'checking' | 'available' | 'unavailable'

export default function LeadForm() {
  const [availability, setAvailability] = useState<Availability>('checking')
  const [deliveryError, setDeliveryError] = useState('')
  const [sent, setSent] = useState(false)
  const successRef = useRef<HTMLDivElement>(null)
  const activeRequest = useRef<{ fingerprint: string; id: string } | null>(null)
  const submissionLock = useRef(false)
  const reportedSuccess = useRef(false)
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur',
    defaultValues: { name: '', company: '', email: '', whatsapp: '', consent: false },
  })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    fetch('/api/leads/status', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unavailable')
        const data: unknown = await response.json()
        setAvailability(data && typeof data === 'object' && 'available' in data && data.available === true ? 'available' : 'unavailable')
      })
      .catch(() => { if (!controller.signal.aborted) setAvailability('unavailable') })
      .finally(() => clearTimeout(timer))
    const fallback = setTimeout(() => setAvailability((value) => value === 'checking' ? 'unavailable' : value), 7200)
    return () => { controller.abort(); clearTimeout(timer); clearTimeout(fallback) }
  }, [])

  useEffect(() => {
    if (sent) successRef.current?.focus({ preventScroll: true })
  }, [sent])

  async function submit(values: LeadFormValues) {
    if (availability !== 'available' || submissionLock.current) return
    submissionLock.current = true
    setDeliveryError('')
    const fingerprint = JSON.stringify(values)
    if (activeRequest.current?.fingerprint !== fingerprint) activeRequest.current = { fingerprint, id: crypto.randomUUID() }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 50000)
    const parameters = new URLSearchParams(window.location.search)
    const attribution = Object.fromEntries(
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
        .filter((key) => parameters.has(key))
        .map((key) => [key, (parameters.get(key) || '').slice(0, 160)]),
    )
    const website = (document.getElementById('norvia-website') as HTMLInputElement | null)?.value || ''
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ ...values, requestId: activeRequest.current!.id, website, landingPath: window.location.pathname.slice(0, 250), attribution }),
      })
      const data: unknown = await response.json()
      if (!response.ok || !data || typeof data !== 'object' || !('ok' in data) || data.ok !== true
        || !('stored' in data) || data.stored !== true
        || !('requestId' in data) || data.requestId !== activeRequest.current!.id) {
        if (response.status === 503) setAvailability('unavailable')
        throw new Error(response.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos para tentar novamente.' : 'Não foi possível concluir o envio. Seus dados foram mantidos. Tente novamente.')
      }
      if (!reportedSuccess.current) {
        reportedSuccess.current = true
        try {
          const analyticsWindow = window as typeof window & { dataLayer?: Record<string, unknown>[] }
          analyticsWindow.dataLayer ??= []
          analyticsWindow.dataLayer.push({ event: 'lead_form_success', form_id: 'norvia_diagnostico', lead_destination: 'google_sheets' })
        } catch {
          // Optional analytics must never turn confirmed storage into a form failure.
        }
      }
      setSent(true)
    } catch (error) {
      setDeliveryError(error instanceof Error && error.name === 'AbortError'
        ? 'O envio está demorando. Tente novamente para consultar a mesma solicitação.'
        : error instanceof Error && error.message.startsWith('Muitas tentativas') ? error.message : 'Não foi possível concluir o envio. Seus dados foram mantidos. Tente novamente.')
    } finally {
      clearTimeout(timer)
      submissionLock.current = false
    }
  }

  if (sent) {
    return <div ref={successRef} className="norvia-form-success" tabIndex={-1} role="region" aria-labelledby="lead-success-title" aria-describedby="lead-success-description lead-success-note">
      <CheckCircle2 aria-hidden="true" size={42} />
      <h3 id="lead-success-title">Solicitação enviada.</h3>
      <p id="lead-success-description">A equipe da Norvia vai entrar em contato para conversar sobre a sua operação e dar sequência ao diagnóstico gratuito.</p>
      <p id="lead-success-note" className="norvia-form-note">Você não precisa enviar novamente.</p>
    </div>
  }

  return <form className="norvia-lead-form" onSubmit={(event) => { void handleSubmit(submit)(event) }} noValidate aria-label="Solicitar diagnóstico gratuito" aria-describedby="lead-required-note" aria-busy={isSubmitting}>
    <p id="lead-required-note" className="norvia-form-note">Todos os campos são obrigatórios.</p>
    <div className="norvia-form-fields">
      <div className="norvia-field">
        <Label htmlFor="lead-name">Nome completo</Label>
        <Input id="lead-name" required disabled={isSubmitting} autoComplete="name" placeholder="Como podemos chamar você?" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} {...register('name')} />
        {errors.name && <p id="name-error" className="norvia-field-error">{errors.name.message}</p>}
      </div>
      <div className="norvia-field">
        <Label htmlFor="lead-company">Empresa</Label>
        <Input id="lead-company" required disabled={isSubmitting} autoComplete="organization" placeholder="Nome da transportadora" aria-invalid={Boolean(errors.company)} aria-describedby={errors.company ? 'company-error' : undefined} {...register('company')} />
        {errors.company && <p id="company-error" className="norvia-field-error">{errors.company.message}</p>}
      </div>
      <div className="norvia-field norvia-field-full">
        <Label htmlFor="lead-role">Seu cargo</Label>
        <select id="lead-role" required disabled={isSubmitting} defaultValue="" aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? 'role-error' : undefined} {...register('role')}>
          <option value="" disabled>Selecione seu cargo</option>
          {jobRoles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        {errors.role && <p id="role-error" className="norvia-field-error">{errors.role.message}</p>}
      </div>
      <div className="norvia-field">
        <Label htmlFor="lead-email">E-mail profissional</Label>
        <Input id="lead-email" required disabled={isSubmitting} type="email" inputMode="email" autoComplete="email" placeholder="voce@empresa.com.br" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
        {errors.email && <p id="email-error" className="norvia-field-error">{errors.email.message}</p>}
      </div>
      <div className="norvia-field">
        <Label htmlFor="lead-whatsapp">WhatsApp com DDD</Label>
        <Input id="lead-whatsapp" required disabled={isSubmitting} type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? 'whatsapp-error' : undefined} {...register('whatsapp')} />
        {errors.whatsapp && <p id="whatsapp-error" className="norvia-field-error">{errors.whatsapp.message}</p>}
      </div>
    </div>
    <div className="norvia-honeypot" aria-hidden="true">
      <label htmlFor="norvia-website">Não preencha este campo</label>
      <input id="norvia-website" name="website" tabIndex={-1} autoComplete="off" />
    </div>
    <div className="norvia-consent-wrap">
      <label className="norvia-consent" htmlFor="lead-consent">
        <input id="lead-consent" required disabled={isSubmitting} type="checkbox" aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'consent-error' : undefined} {...register('consent')} />
        <span>Autorizo a Norvia a entrar em contato sobre esta solicitação. Saiba como seus dados são tratados na <a href="https://www.norviasecurity.com.br/privacidade.html" target="_blank" rel="noreferrer">Política de Privacidade</a>.</span>
      </label>
      {errors.consent && <p id="consent-error" className="norvia-field-error">{errors.consent.message}</p>}
    </div>
    <div className="norvia-form-status" aria-live="polite" aria-atomic="true">
      {availability === 'checking' && <p className="norvia-form-note">Verificando disponibilidade do formulário…</p>}
      {availability === 'unavailable' && <div className="norvia-form-unavailable"><p>O formulário está temporariamente indisponível.</p><a href="https://wa.me/5511996197517" target="_blank" rel="noreferrer">Falar com a Norvia pelo WhatsApp <ArrowUpRight size={15} aria-hidden="true" /></a></div>}
      {deliveryError && <p className="norvia-form-error" role="alert">{deliveryError}</p>}
    </div>
    <Button className="norvia-form-submit" type="submit" disabled={availability !== 'available' || isSubmitting}>
      {isSubmitting ? <><LoaderCircle className="norvia-form-spinner" size={19} aria-hidden="true" /> Enviando solicitação…</> : <>Solicitar diagnóstico gratuito <ArrowUpRight size={20} aria-hidden="true" /></>}
    </Button>
    <p className="norvia-form-reassurance"><LockKeyhole size={14} aria-hidden="true" /> Sem custo e sem compromisso de contratação.</p>
  </form>
}
