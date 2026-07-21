---
name: lgpd-checklist
description: LGPD compliance checklist for projects handling personal data — data inventory, legal basis, retention/anonymization, data subject rights. Use when user asks about LGPD, personal data handling, privacy compliance, data retention policy, or "direito do titular"/data subject requests. Stack-agnostic — depends on data type, not framework.
---

# LGPD — Checklist de Conformidade

Aplica-se a qualquer sistema que colete, armazene ou processe dado pessoal, independente de linguagem ou stack. O que muda entre projetos é o **tipo de dado** tratado (cadastral, sensível, financeiro, saúde), não o framework. Relevante em qualquer projeto freela pra cliente que lide com dado de usuário final — vale checar mesmo em MVP pequeno.

## Quando usar esta skill

- Novo projeto ou feature que coleta dado de pessoa física (cliente, funcionário, paciente, candidato)
- Revisão de schema/modelo de dados antes de subir pra produção
- Cliente pergunta "isso está em conformidade com LGPD?"
- Auditoria de retenção de dados ou pedido de exclusão de um titular

## Dado pessoal x dado pessoal sensível

- **Dado pessoal**: qualquer informação que identifique ou torne identificável uma pessoa natural (nome, e-mail, CPF, IP, geolocalização, ID de dispositivo)
- **Dado pessoal sensível**: origem racial/étnica, convicção religiosa, opinião política, filiação sindical, dado de saúde ou vida sexual, dado genético/biométrico
- Dado sensível exige base legal mais restrita e controles de segurança mais rígidos — trate como "sensível até prova em contrário" quando o tipo de projeto for saúde, RH ou biometria

## Checklist — Inventário de dado pessoal

- [ ] Mapear toda tabela/coleção que armazena dado pessoal (nome, e-mail, CPF, telefone, endereço, IP, cookies, geolocalização)
- [ ] Marcar explicitamente colunas de dado sensível (saúde, biometria, orientação, dado de menor de idade)
- [ ] Documentar de onde cada dado vem (formulário, integração de terceiro, webhook, importação em lote)
- [ ] Documentar para onde cada dado vai (logs, filas, serviços terceiros, backups, planilhas de exportação, analytics)
- [ ] Identificar campos de dado pessoal em logs de aplicação e de infraestrutura — esses são o ponto cego mais comum (ver skill `structured-logging`)
- [ ] Mapear dado pessoal em anexos e arquivos não-estruturados (uploads, PDFs, imagens), não só em colunas de banco

## Checklist — Base legal

- [ ] Cada finalidade de tratamento de dado tem uma base legal identificada e documentada (consentimento, execução de contrato, obrigação legal, legítimo interesse, etc.) — antes de coletar, não depois
- [ ] Se a base for consentimento: o texto é específico pra finalidade, não um "aceito os termos" genérico; o consentimento é registrado com data/hora e é possível revogar
- [ ] Se a base for legítimo interesse: existe um teste de balanceamento documentado (necessidade, finalidade, impacto no titular) — não é só "achamos que é razoável"
- [ ] Coleta de dado não vai além da finalidade declarada (minimização) — campo "por via das dúvidas" é red flag
- [ ] Dado de criança/adolescente tem tratamento com base legal específica e, quando aplicável, consentimento dos pais/responsável
- [ ] Compartilhamento com terceiros (processadores) tem contrato/cláusula de proteção de dado e finalidade delimitada

## Checklist — Retenção e anonimização

- [ ] Cada tipo de dado tem prazo de retenção definido, ligado à finalidade ou obrigação legal — não "guardar para sempre por segurança"
- [ ] Existe rotina (job agendado, trigger, processo manual documentado) que executa a exclusão/anonimização ao fim do prazo
- [ ] Anonimização é irreversível de fato — pseudonimização (hash reversível, ID trocado por token) não é anonimização e continua sendo dado pessoal
- [ ] Backups seguem o mesmo prazo de retenção que os dados vivos, ou há processo pra expurgar dado pessoal de backups antigos
- [ ] Ambientes de teste/homologação não usam dump de produção com dado real sem anonimização prévia
- [ ] Exclusão de conta do titular propaga para dados derivados (cache, índice de busca, data warehouse, ferramentas de analytics/marketing)

## Checklist — Direitos do titular

- [ ] Existe fluxo (endpoint, formulário, processo manual) pra atender pedido de acesso aos dados do titular
- [ ] Existe fluxo pra correção de dado incorreto/desatualizado
- [ ] Existe fluxo pra exclusão (eliminação) de dados, respeitando exceções legais quando houver (ex: obrigação fiscal)
- [ ] Existe fluxo pra portabilidade (exportar dado do titular em formato estruturado)
- [ ] Existe fluxo pra revogação de consentimento, e a revogação é aplicada retroativamente ao tratamento que dependia dela
- [ ] Existe canal identificado de contato do titular (e-mail, formulário) e prazo de resposta definido internamente
- [ ] Decisão automatizada que afeta o titular (score de crédito, triagem de currículo) pode ser explicada e contestada mediante solicitação

## Checklist — Segurança e incidentes

- [ ] Dado pessoal sensível é criptografado em repouso, não só em trânsito
- [ ] Controle de acesso por papel — só quem precisa do dado pra função tem acesso a ele (princípio do menor privilégio)
- [ ] Log de acesso a dado sensível existe e é auditável (quem acessou o quê, quando)
- [ ] Existe plano de resposta a incidente que cobre: contenção, avaliação de risco ao titular, comunicação à autoridade competente e aos titulares afetados quando o risco for relevante (ver `secrets-management` pro checklist técnico de resposta a vazamento)
- [ ] Fornecedores/processadores terceiros (hosting, e-mail transacional, analytics, CRM) estão listados e têm cláusula de proteção de dado no contrato

## Anti-patterns

- ❌ Coletar dado "por via das dúvidas" sem finalidade definida
- ❌ Checkbox de aceite genérico cobrindo tratamentos completamente diferentes
- ❌ Dado pessoal em log de aplicação sem mascaramento (CPF, senha, cartão em texto plano)
- ❌ Confundir pseudonimização com anonimização
- ❌ Reter dado indefinidamente porque "pode ser útil depois"
- ❌ Copiar dump de produção pra ambiente de teste sem anonimizar
- ❌ Base legal decidida depois que o cliente/titular questiona, não antes da coleta
- ❌ Fluxo de exclusão que apaga da tabela principal mas esquece cache, backup e data warehouse
- ❌ Tratar todo dado sensível (saúde, biometria) com o mesmo nível de controle de um cadastro comum

## Exemplos por tipo de projeto

**E-commerce/loja para cliente freela**: dado de pagamento (nunca armazenar número de cartão completo — usar tokenização do gateway), histórico de compra como perfil pra recomendação exige base legal própria (legítimo interesse ou consentimento, não só "execução de contrato"), endereço de entrega tem prazo de retenção ligado à garantia/nota fiscal.

**Saúde (prontuário, telemedicina)**: dado de saúde é sensível por definição — criptografia em repouso é mínimo, não diferencial. Prazo de retenção de prontuário costuma ser definido por norma do conselho profissional, não pela empresa/cliente. Acesso precisa de trilha de auditoria detalhada (quem viu o prontuário de quem).

**RH / recrutamento / plataforma de curso (ex: SaaS educacional)**: currículo e dado de candidato/aluno não aprovado tem prazo de retenção curto e finalidade específica — manter "banco de talentos" exige consentimento separado. Avaliação/score automatizado cai na regra de decisão automatizada explicável.
