import { z } from 'zod'

export const jobRoles = [
  'Dono ou diretor',
  'Gestor de TI',
  'Gestor de operações',
  'Outro',
] as const

const singleLine = (minimum: number, maximum: number, message: string) =>
  z.string().trim().min(minimum, message).max(maximum, 'Use um texto mais curto.').regex(/^[^\r\n]*$/, 'Use apenas uma linha.')

export const leadFormSchema = z.object({
  name: singleLine(3, 120, 'Informe seu nome completo.'),
  company: singleLine(2, 160, 'Informe o nome da empresa.'),
  role: z.enum(jobRoles, { error: 'Selecione seu cargo.' }),
  email: z.string().trim().max(160).email('Informe um e-mail válido.'),
  whatsapp: z.string().trim().max(24).refine((value) => {
    const digits = value.replace(/\D/g, '')
    const national = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
    return /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(national)
  }, 'Informe um WhatsApp com DDD.'),
  consent: z.boolean().refine((value) => value, 'Autorize o contato para continuar.'),
})

export const leadRequestSchema = leadFormSchema.extend({
  requestId: z.uuid(),
  website: z.string().max(200).optional().default(''),
  landingPath: z.string().max(250).regex(/^\/[\S]*$/).optional(),
  attribution: z.object({
    utm_source: z.string().max(160).optional(),
    utm_medium: z.string().max(160).optional(),
    utm_campaign: z.string().max(160).optional(),
    utm_content: z.string().max(160).optional(),
    utm_term: z.string().max(160).optional(),
  }).strict().optional(),
}).strict()

export type LeadFormValues = z.infer<typeof leadFormSchema>
export type LeadRequest = z.infer<typeof leadRequestSchema>

export function normalizeBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('55') && digits.length > 11 ? `+${digits}` : `+55${digits}`
}
