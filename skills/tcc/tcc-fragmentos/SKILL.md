---
name: tcc-fragmentos
description: Captura matéria-prima bruta de TCC acadêmico — anotações de leitura, observações sobre código do projeto, decisões técnicas, citações, ideias soltas — em arquivo de fragmentos antes de virar texto formal. Use quando o usuário menciona "fragmentos do TCC", "anotações para o capítulo X", "ideias soltas pro TCC", "matéria-prima", "vou anotar pra escrever depois", ou inicia uma sessão de captura antes do drafting formal. Não substitui escrita formal — alimenta a etapa de rascunho com material bruto. Sempre em português, voz livre nesta fase (a impessoalidade entra no rascunho).
allowed-tools: Read, Write, Edit
---

# TCC Fragmentos

Sessão de entrevista que minera o usuário em busca de fragmentos — pedaços heterogêneos de texto que **podem** entrar no capítulo final do TCC: afirmações, vinhetas, frases nítidas, citações encontradas em leitura, observações sobre o próprio código do projeto, decisões técnicas registradas. Tudo vai para um único arquivo de matéria-prima.

Esta skill **não** aplica normas ABNT, não exige voz impessoal, não estrutura nada. Estrutura entra na próxima fase (`tcc-rascunho`). Aqui o objetivo é **acumular material** que o autor poderá revisitar.

## Quando usar

- Usuário diz "vou anotar fragmentos pro capítulo X".
- Usuário acabou de ler um artigo/livro e quer salvar trechos relevantes.
- Usuário viu algo no próprio código (`src/`, `supabase/migrations/`, `docs/`) que precisa virar texto no TCC.
- Usuário teve uma ideia solta e quer guardar antes de esquecer.
- Início de capítulo novo, sem material acumulado.

## Quando NÃO usar

- Reescrita de seção já existente → use edição direta no capítulo.
- Aplicar normas ABNT → use `tcc-writing` (skill do projeto).
- Moldar fragmentos em parágrafos formatados → use `tcc-rascunho`.
- Revisão de voz impessoal/clichês → use `tcc-revisao-impessoal`.

## Processo

### 1. Localizar o arquivo de fragmentos

Padrão do projeto SyncClass:
```
docs/tcc/_fragmentos/cap{N}-fragmentos.md
```

Onde `N` é o número do capítulo (1–10). Se o usuário não disse o capítulo, pergunte **uma vez** e lembre pelo resto da sessão.

Se o arquivo não existe, criar com H1 contendo título de trabalho do capítulo. Nada mais — sem TOC, sem data, sem metadados.

Exemplo de primeira escrita:
```markdown
# Fragmentos — Capítulo 3 Metodologia

```

### 2. Capturar fragmentos a cada mensagem

A cada coisa que o usuário disser, identificar o que pode virar fragmento. Anexar ao arquivo silenciosamente. Mencionar de passagem ("adicionei isso"), sem interromper o fluxo.

**Antes de cada escrita:** re-ler o arquivo do disco. O usuário pode ter editado, reordenado ou deletado fragmentos entre turnos. Nunca sobrescrever — só anexar (a menos que o usuário peça edição em lugar).

### 3. Formato do fragmento

Separador: `---` em linha própria, com linha em branco antes e depois.

Cada fragmento pode ser:
- Uma frase nítida sozinha.
- Um parágrafo curto.
- Uma citação direta (com referência, mesmo que incompleta).
- Uma observação técnica sobre o código.
- Uma lista de pontos que andam juntos por sensação.
- Uma analogia, vinheta, lembrança de reunião com orientador.

**Não impor estrutura.** Não numerar. Não adicionar headings dentro do corpo. Ordem é a ordem de chegada — usuário reorganiza depois se quiser.

### 4. Tipos de fragmento típicos no TCC

#### Trecho de leitura
```markdown
> "A pesquisa-ação é um tipo de pesquisa social com base empírica que é
> concebida e realizada em estreita associação com uma ação."
> (THIOLLENT, 2011, p. 14)

Bom pra abertura da seção de metodologia. Confirmar página.

---
```

#### Observação sobre código
```markdown
Em `src/integrations/supabase/client.ts` o cliente é instanciado uma
única vez como singleton. Vale destacar no capítulo 6 — mostra que
projeto evita múltiplas conexões redundantes.

---
```

#### Decisão técnica
```markdown
Supabase escolhido sobre Firebase porque:
- RLS nativo no PostgreSQL (Firebase não tem nada equivalente).
- Schema SQL versionável (Firebase é NoSQL e versioning é doloroso).
- Custo previsível (Firebase escala em $$ rápido).

Material pra justificativa do capítulo 5.

---
```

#### Ideia solta
```markdown
Algo sobre como "IA como copiloto" é diferente de "IA como ferramenta".
Copiloto sugere parceria contínua, ferramenta sugere uso pontual.
Trabalhar isso melhor no capítulo 3.

---
```

#### Citação que precisa virar referência
```markdown
NIST tem definição canônica de Cloud Computing — 5 características essenciais.
Procurar o documento oficial (era SP 800-145?) e citar formal no cap. 2.

---
```

## Postura conversacional

Esta é uma **sessão de grill-me**. Entrevistar o usuário sobre o que ele está pensando:

- "Que parte do código você acha que merece destaque no capítulo?"
- "Que decisão técnica ainda não tem justificativa registrada?"
- "Esse livro que você leu — qual frase ficou? Vamos guardar."
- "Reunião com orientador semana passada — alguma observação que precisa virar texto?"

Perguntar **uma de cada vez**. Esperar resposta. Capturar o fragmento que emerge da resposta antes de fazer próxima pergunta.

Se o usuário responde curto ("não sei", "passa"), trocar de ângulo — não insistir.

## Encerramento

Sessão termina quando:
- Usuário diz que chega.
- 15+ fragmentos foram capturados (suficiente pra começar `tcc-rascunho`).
- Usuário começa a repetir fragmentos já registrados.

Ao encerrar, mostrar contagem: "Capítulo X agora tem N fragmentos. Pronto pra entrar em `tcc-rascunho` quando quiser."

## Bar do fragmento

Não é "isso está pronto para o TCC". É **"isso me serve quando eu voltar?"**.

Fragmento ruim é o que o autor não vai entender 1 mês depois — sem contexto suficiente. Fragmento bom é texto cru mas decodificável pelo autor.

Voz nesta fase é **livre** — o autor pode escrever em primeira pessoa, gírias, abreviações. A passagem para impessoal acadêmico acontece em `tcc-rascunho`, nunca aqui.
