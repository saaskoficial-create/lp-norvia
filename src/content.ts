import { FileCheck2, KeyRound, Radar, DatabaseBackup, ShieldAlert, Network } from 'lucide-react'

export const coverage = [
  { icon: FileCheck2, title: 'Emissão e certificados', text: 'Atenção aos certificados digitais e aos sistemas de CT-e e MDF-e que permitem a saída da carga.' },
  { icon: Radar, title: 'Rastreamento e gestão', text: 'Um olhar integrado sobre rastreamento, ERP e os sistemas que conectam a sua operação.' },
  { icon: KeyRound, title: 'Acessos sob controle', text: 'Organização de permissões de colaboradores, motoristas e prestadores. Cada pessoa com o acesso necessário.' },
  { icon: DatabaseBackup, title: 'Backup e recuperação', text: 'Verificação das cópias e testes de restauração. Você precisa saber como recuperar a operação.' },
  { icon: ShieldAlert, title: 'Credenciais expostas', text: 'Identificação de exposição de credenciais e orientação para reduzir os riscos de acesso indevido.' },
  { icon: Network, title: 'Fornecedores conectados', text: 'Mapeamento de acessos de terceiros e das dependências que também podem afetar sua transportadora.' },
]

export const steps = [
  { title: 'Entender', subtitle: 'Diagnóstico gratuito', text: 'Solicite uma primeira avaliação. A equipe entra em contato para alinhar o levantamento de exposição pública da sua empresa.' },
  { title: 'Priorizar', subtitle: 'Auditoria', text: 'Com o aprofundamento contratado, os riscos ganham contexto e um plano de correção com prioridades claras.' },
  { title: 'Corrigir', subtitle: 'Implementação', text: 'As ações acordadas são colocadas em prática, com procedimentos para os sistemas críticos da operação.' },
  { title: 'Acompanhar', subtitle: 'Monitoramento', text: 'A continuidade exige rotina: acompanhar os pontos críticos e verificar o que precisa seguir funcionando.' },
]

export const questions = [
  { question: 'O que é o diagnóstico gratuito?', answer: 'É uma primeira avaliação da exposição pública da sua empresa a riscos digitais. Após a solicitação, a equipe da Norvia entra em contato para alinhar o escopo e os próximos passos. Não é uma auditoria completa nem uma varredura automática feita por este formulário.' },
  { question: 'Vocês precisam acessar nossos sistemas?', answer: 'O levantamento inicial utiliza informações públicas. Qualquer trabalho que envolva acesso a sistemas, rede ou dados internos depende de escopo e autorização específicos, combinados diretamente com a Norvia.' },
  { question: 'O serviço serve para a minha transportadora?', answer: 'A Norvia atua com transportadoras de carga rodoviária de médio e grande porte. A avaliação considera a sua estrutura, os sistemas utilizados e as dependências que sustentam a operação.' },
  { question: 'Solicitar o diagnóstico me obriga a contratar?', answer: 'Não. O diagnóstico inicial é gratuito e sem compromisso de contratação. Auditoria, implementação e monitoramento são etapas posteriores, com escopo e condições acordados separadamente.' },
  { question: 'Já temos uma equipe de TI. Ainda faz sentido?', answer: 'Sim. A proposta é olhar os riscos de segurança e continuidade no contexto da transportadora. Esse trabalho pode ser alinhado com os responsáveis de TI e com os fornecedores que já atendem a operação.' },
]
