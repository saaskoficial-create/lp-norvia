# Norvia Security — direção visual final

LP independente para campanhas, destinada a donos, diretores e gestores de TI/operações de transportadoras rodoviárias de médio e grande porte. Conversão: diagnóstico gratuito solicitado no formulário com retorno da equipe por contato. Não aciona scanner.

## Direção confirmada

Em 28/10/2026, Rodrigo pediu uma abordagem mais visual inspirada em https://www.fitfacil.com.br/ . A versão inicial clara foi substituída por direção cinematográfica escura: fotografia de transporte em fundo imersivo, brilho âmbar, título central amplo, navegação flutuante, controles em pílula, cards com profundidade, mapa operacional interativo e novas seções fotográficas.

Manter Norvia: logotipo em chevron e paleta grafite/âmbar do site oficial. A inspiração vem da composição e ritmo da referência; não usa a marca FitFácil, imagens fitness, oferta ou funcionalidades daquela empresa.

## Tokens

Grafite `#090E11`, superfícies `#182226`, texto `#F2F3ED`, secundário `#B1BDB8`, âmbar `#E9951B`, destaque `#FFC265`. Archivo Variable para títulos e corpo; IBM Plex Mono para etapas. Fontes locais, com licença. Tema escuro único.

Container de até 1160px; margens 22px no celular. Cabeçalho flutuante com menu móvel acessível. Abertura central com título até 86px; títulos de seção entre 36–60px. Controles de pelo menos 44px. Ritmo de 72–112px entre seções. O âmbar orienta ações e pontos de atenção; não representa estado real de monitoramento.

## Composição e interações

1. Abertura fotográfica com promessa, CTA de diagnóstico e três pilares da continuidade.
2. Contexto humano da logística e consequências de falhas digitais.
3. Vazamentos de dados: texto editorial e diagrama de credencial exposta → acesso indevido → operação em risco. Ilustração conceitual, sem alegar incidente, varredura ou dado real.
4. Explorador dos pontos críticos: cinco botões selecionáveis, descrição acessível e seis frentes de cobertura em composição bento. Representação conceitual, sem tela de produto nem dado fictício.
5. Quatro etapas reais de trabalho, iniciando no diagnóstico gratuito. No desktop, uma leitura editorial vertical acompanha a ilustração fixa que muda de fase. No mobile, um acordeão mostra uma etapa por vez.
6. Seção imersiva de rodovia para retomar a continuidade do negócio.
7. Formulário com gravação em Google Sheets da Saask através do Kestra, com estados reais de disponibilidade.
8. FAQ e contatos oficiais.

A promessa da abertura e o CTA permanecem visíveis desde o primeiro render. A revisão de movimento solicitada em 28/10 usa GSAP e ScrollTrigger depois de load e período ocioso. O circuito da abertura combina desenho dos SVGs, linhas expansivas, entrada do escudo e pilares em sequência. Cards e etapas usam 26–38px de deslocamento, opacidade de 0,2 a 1 e duração de 0,68s; as fotografias têm parallax apenas no desktop. A linha das etapas acompanha a rolagem sem fixar ou controlar o scroll.

O diagrama de vazamentos tem uma sequência finita de 5,9s: entrada dos nós, desenho das conexões e pontos seguindo os caminhos. Ao terminar, fica estático e pode ser repetido pelo controle Rever sequência. O controle global Pausar animações restaura o CSS legível, encerra timelines e mantém a preferência local. A configuração de redução de movimento do dispositivo tem prioridade e evita o download de GSAP quando ativa na abertura. Nenhuma animação bloqueia CTA ou formulário. A seleção do explorador continua em CSS, sem propriedades disputadas entre engines. O cabeçalho passa ao menu compacto em até 1000px para acomodar o novo link e controle.

A comparação adicional com FitFácil trouxe a entrada do título por linhas mascaradas (CSS, 0,72s e intervalo de 0,08s), a narrativa de etapas com visual fixo e a frase fotográfica com escala/opacidade ligada ao scroll. As ilustrações da Norvia representam as etapas conceitualmente; não simulam telas de um produto ou resultados de uma auditoria.

## Mobile compacto

O explorador de cinco pontos segue como interação principal da cobertura. As seis descrições ficam em um detalhe expansível, em linhas simples; o bento de seis cartões aparece apenas no desktop. A explicação editorial de vazamentos é recolhível em até 540px, mantendo o diagrama visível com 406px de altura. As etapas usam acordeão nativo de grupo exclusivo, primeira etapa aberta. O texto integral permanece acessível ao expandir. Fotos menores e espaçamento de 64px reduzem o comprimento da página sem alterar os campos da conversão. Details nativos não têm animação de altura, evitando saltos demorados e trabalho de layout a cada frame.

## Fontes

Briefing define público, dores, entregas e especialização. Site oficial confirma marca, contato, diagnóstico gratuito e etapas. Copy nova autorizada por Rodrigo; sem provas sociais, preços, métricas ou prazos inventados. Fontes privadas e IDs de ClickUp não integram o código público.

Foto principal: Sergei Skrynnik / Pexels, https://www.pexels.com/photo/photo-of-a-white-truck-on-the-road-11053644/ . Fotos adicionais e licenças em `ASSETS.md`. São imagens ilustrativas de transporte/logística, sem representar frota, equipe ou endosso à Norvia.

## Conversão

Nome, empresa, cargo, e-mail, WhatsApp e autorização de retorno. API Node/Express no mesmo domínio; webhook Kestra apenas no servidor, com confirmação de gravação da mesma solicitação na planilha. Nenhum dado pessoal é enviado ao dataLayer. Credenciais e URLs secretas não integram o bundle. O estado real de validação de ponta a ponta fica em QA.md.

## Carregamento e performance medidos

Formulário e FAQ usam import dinâmico e carregamento por proximidade com IntersectionObserver; as áreas mantêm altura mínima reservada. As âncoras continuam disponíveis antes do carregamento. Fontes são hospedadas localmente e a foto principal usa WebP responsivo (720px: 20,2KB; 1400px: 106,2KB) com preload prioritário. Imagens abaixo da abertura são lazy.

O JavaScript inicial atual é de 273,88KB (gzip 84,20KB), com a nova seção, os controles e a narrativa de etapas, frente aos 433,44KB iniciais (gzip 137,49KB). Formulário e FAQ ficam em chunks separados. GSAP e ScrollTrigger são opcionais e posteriores ao caminho crítico.

A revisão atual, com narrativa desktop e mobile compacto, marcou desempenho 100, acessibilidade 100 e SEO 100 no Lighthouse móvel local; FCP/LCP 1,1s, CLS 0, TBT 0ms e Speed Index 1,6s. A página em 390px ficou com 8626px de altura, frente aos 11117px da captura anterior, aproximadamente 22% menos rolagem nesse cenário. Os detalhes estão em QA.md. São resultados de laboratório e de capturas locais, não métricas de usuários reais nem garantia da futura hospedagem. O contêiner GTM-MBCBKQN9 permanece instalado; seu carregamento não prova disparo de cada tag configurada dentro dele.

Validação em 360, 390, 768 e 1440px sem overflow, com menu por teclado, FAQ, formulário carregado por CTA, mapa interativo e redução de movimento. Capturas finais desktop/mobile inspecionadas; nenhum formulário foi submetido durante esta etapa de QA visual/performance.
