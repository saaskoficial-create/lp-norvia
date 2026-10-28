# Norvia Security — LP de diagnóstico gratuito

Landing page independente para campanhas de segurança digital e continuidade operacional de transportadoras. React + TypeScript, Vite, Tailwind CSS e componentes shadcn/ui reais (Base UI). API Express no mesmo domínio para entregar solicitações ao Google Sheets da Saask por meio do Kestra. Idioma pt-BR.

O preview local de produção está em **http://localhost:4173/**. O código está salvo no repositório público [saaskoficial-create/lp-norvia](https://github.com/saaskoficial-create/lp-norvia), branch `main`. A LP não substitui o site institucional; o cadastro na Vercel foi iniciado com o Google da Saask e a publicação aguarda a verificação por SMS exigida pela plataforma.

## Instalação e execução

Requer Node.js 24 e npm. Na pasta do projeto:

```powershell
npm ci
npm run dev
```

O desenvolvimento usa `http://localhost:5173`; o Vite encaminha `/api` para `127.0.0.1:8787`. Para executar a versão de produção com a API no mesmo processo:

```powershell
npm run build
$env:NODE_ENV = 'production'
$env:PORT = '4173'
npm start
```

`npm run preview` serve apenas os arquivos estáticos. Para exercitar o formulário, use o servidor de desenvolvimento com API ou o servidor Node de produção.

```powershell
npm run typecheck
npm run lint
npx tsx --test server/app.test.ts server/kestra.test.ts
python -m unittest discover -s integrations -p "test_*.py"
npm run build
```

## Conversão: LP → Kestra → Google Sheets

Destino configurado para a integração: [planilha da Saask](https://docs.google.com/spreadsheets/d/1yRGXffNhIA2lg4ZmI2nRSBSYhHs1LnLMZ2G4bu0B9O8/edit), aba **Leads LP**. A pasta Leads e a planilha têm acesso restrito ao proprietário e ao colaborador já autorizado; a herança pública do ancestral foi interrompida na pasta Leads. O transporte da LP não envia e-mail nem grava diretamente no Sheets.

Copie `.env.example` para `.env` e configure somente no servidor:

- `KESTRA_LEAD_WEBHOOK_URL`: endereço HTTPS do webhook do flow responsável por validar e gravar na planilha. HTTP só é aceito para `localhost` e loopback nos testes locais.
- `KESTRA_AUTHORIZATION`: cabeçalho Authorization completo, opcional e somente quando o endpoint precisar de autenticação adicional.
- `PORT`: porta do servidor, 8787 por padrão; o preview de produção usa 4173.
- `NODE_ENV=production`: ativa o servidor dos arquivos de `dist` pelo Express.

O webhook e sua autenticação são segredos: nunca usar variáveis `VITE_`, incluí-los no bundle, logs ou repositório. Credenciais de Google/Sheets ficam no Kestra. Não é necessário configurar Resend ou credenciais SMTP.

### Contrato da API e confirmação

`GET /api/leads/status` retorna `{ available: boolean }` conforme a configuração do servidor. Isso comprova apenas configuração sintaticamente válida, não disponibilidade do Kestra ou acesso real à planilha. Sem webhook válido, a API responde 503 ao envio e o formulário mostra indisponibilidade com o WhatsApp oficial como contato secundário.

`POST /api/leads` recebe nome, empresa, cargo, e-mail, WhatsApp com DDD, autorização de retorno, UUID `requestId`, caminho da página, UTMs conhecidas e honeypot. Zod valida no navegador e no servidor; telefone é normalizado antes do transporte. Destino e autenticação nunca vêm do navegador.

O servidor chama o webhook com `wait=true&returnOutputs=true` e aguarda o resultado. Exige este mapa **diretamente no corpo JSON da resposta**, com o mesmo UUID enviado:

```json
{
  "ok": true,
  "stored": true,
  "requestId": "UUID-DA-SOLICITACAO",
  "spreadsheetId": "ID-DA-PLANILHA"
}
```

Um HTTP 200 genérico, uma execução `CREATED`/`RUNNING`, um wrapper `outputs`, ausência de `stored:true`, ID diferente ou ID de planilha vazio não confirmam gravação. Só após a confirmação a API retorna `{ ok:true, stored:true, requestId }` à LP. O formulário registra um **pedido de contato** para diagnóstico; não aciona scanner nem autoriza acesso aos sistemas da transportadora.

O limite é 45 segundos no servidor e 50 segundos no navegador. Erro e timeout preservam os campos; uma tentativa manual com os mesmos dados mantém `requestId`. O cache de resultados e operações pendentes evita duplicidade no mesmo processo por até 24 horas. O flow Kestra deduplica esse UUID consultando a planilha sob concorrência `1 / QUEUE` e confirma a linha após a gravação. A repetição direta no Kestra, sem passar pelo cache da API, foi testada sem criar outra linha. Não há retry automático do navegador.

Limite de tamanho, honeypot e rate limiting estão implementados. Respostas: 400 dados inválidos, 405 método, 413 tamanho, 429 tentativas, 503 configuração ausente e 502/504 falha/timeout do destino. Detalhes internos não chegam ao visitante. O limiter é de processo único; múltiplas réplicas exigem armazenamento compartilhado e configuração do proxy conforme a topologia real.

## Google Tag Manager

O HTML inclui script e fallback `noscript` do container **GTM-MBCBKQN9**. O formulário emite uma vez por envio confirmado:

```javascript
dataLayer.push({
  event: 'lead_form_success',
  form_id: 'norvia_diagnostico',
  lead_destination: 'google_sheets'
})
```

O evento não inclui nome, telefone, e-mail ou UUID; não dispara em clique, validação inválida, erro ou simples aceite de execução. Falha do analytics não invalida um lead já armazenado. As tags e conversões efetivas dependem da configuração publicada no container; instalar o snippet não comprova entrega de eventos ao Google Ads/Meta. Antes de tráfego público, alinhar a política de privacidade às tags realmente ativadas.

## Visual, movimento e carregamento

Direção escura cinematográfica com grafite e âmbar da Norvia, fotografias de contexto logístico e copy específica para transportadoras. Fonts Archivo e IBM Plex Mono locais. Imagens WebP responsivas, dimensões explícitas, prioridade/preload da foto de abertura e lazy loading abaixo da dobra.

Formulário e FAQ são carregados em chunks quando se aproximam da viewport. GSAP e ScrollTrigger são importados após `window.load` e tempo ocioso, sem esconder a promessa, navegação, CTAs ou formulário. O circuito da abertura desenha os ícones e as linhas em sequência; cards entram com deslocamentos de 26–38px, fotos têm parallax no desktop e a linha das etapas acompanha a rolagem.

A seção **Vazamentos** apresenta uma ilustração conceitual de credencial exposta → acesso indevido → risco para a operação. A sequência de 5,9s desenha as conexões e move os pontos entre as etapas, depois permanece estática. O botão **Rever sequência** permite repetir. Não há varredura nem alegação de incidente real.

O controle **Pausar animações** restaura o conteúdo estático e salva a preferência localmente. A redução de movimento do dispositivo tem prioridade, sem baixar GSAP quando já estiver ativa na abertura. A desmontagem limpa listeners, agendamento, timelines e contextos de animação.

Inspirado na leitura guiada do FitFácil, o desktop apresenta as etapas em texto editorial com uma ilustração fixa que muda durante a rolagem. No celular, as mesmas etapas viram um acordeão compacto: uma aberta por vez, com o texto completo preservado. O título inicial entra por linhas mascaradas em CSS e a frase sobre a foto ganha presença por GSAP/ScrollTrigger; cada elemento tem um único motor de animação.

O mobile prioriza o explorador interativo das cinco áreas de risco. As seis descrições adicionais de cobertura ficam em um único detalhe expansível com linhas de texto, sem empilhar seis cards. A explicação complementar sobre vazamentos também é expansível, e as fotos e espaçamentos foram compactados. O formulário e seus campos permanecem iguais. A abertura de detalhes recalcula os gatilhos de rolagem.

O JavaScript inicial atual é de 273,88 kB (gzip 84,20 kB), incluindo a nova seção, os controles e a narrativa de etapas, frente aos 433,44 kB iniciais (gzip 137,49 kB). As verificações e seus limites estão em `VALIDATION.md`; resultados de laboratório local não comprovam métricas de usuários reais ou de uma futura hospedagem pública.

## Hospedagem e entrega

O formulário precisa do runtime Node. Publicar só `dist` não executa a API. A configuração `vercel.json` usa Vite para os assets e `api/index.ts` para a função Node, com rotas `/api` preservadas, região `gru1` e duração máxima de 60s. O servidor standalone continua disponível para desenvolvimento e outras hospedagens.

Na Vercel, usar Node **24.x**, build `npm run build`, saída `dist` e as variáveis de servidor `KESTRA_LEAD_WEBHOOK_URL` e `NODEJS_HELPERS=0` em Production e Preview. Configurar `KESTRA_AUTHORIZATION` apenas se o destino exigir. Marcar credenciais como sensíveis; nunca prefixar com `VITE_`. A função usa um único hop de proxy confiável apenas quando `VERCEL=1` e deixa o parser Express aplicar o limite de 8kb. O cache e o limite locais são por instância; a deduplicação durável acontece no Kestra.

GitHub publicado como repositório público em `main`; a checagem Linux passou com instalação limpa, lint, 19 testes TypeScript, 18 testes Python e build. A primeira checagem revelou dependências opcionais ausentes, corrigidas regenerando o lockfile em Node 24 Linux. O adaptador está preparado para Vercel. O cadastro foi iniciado com o Google da Saask e aguarda a verificação de telefone por SMS exigida pela Vercel. Nenhum deploy na Vercel foi confirmado. Definir canonical e URLs absolutas de compartilhamento quando o endereço público estiver confirmado. `social-card.png` já está incluída.

Os 19 testes TypeScript e os 18 testes Python usam destinos simulados. Separadamente, um envio fictício pela interface foi confirmado no Kestra e na planilha; repetir o mesmo UUID não duplicou a linha. O evento de sucesso foi observado uma vez, sem dados de contato. As verificações estão resumidas em `VALIDATION.md`; credenciais, registros de teste e identificadores privados de execução ficam fora do repositório.

## Fontes e ativos

Marca, contatos e oferta: [site oficial da Norvia](https://www.norviasecurity.com.br/). [Política de privacidade](https://www.norviasecurity.com.br/privacidade.html). Direção visual em `DESIGN.md`; fontes e licenças das fotografias em `ASSETS.md`. As imagens ilustrativas não representam a frota, equipe ou clientes da Norvia.

Foto principal: [Sergei Skrynnik / Pexels](https://www.pexels.com/photo/photo-of-a-white-truck-on-the-road-11053644/), conforme [licença Pexels](https://www.pexels.com/license/). Licenças das fontes em `public/fonts`. Componentes gerados pela CLI oficial shadcn/ui e adaptados à identidade. Estilos da distribuição shadcn (MIT) preservados em `src/shadcn-variants.css`, com aviso em `THIRD-PARTY-NOTICES.md`.
