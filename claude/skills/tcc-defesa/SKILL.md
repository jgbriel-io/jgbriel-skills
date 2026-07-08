---
name: tcc-defesa
description: Monta a apresentação de defesa do TCC SyncClass a partir dos capítulos escritos — arco narrativo, roteiro slide a slide com tempo, script de fala, corte do que não apresentar e plano de ensaio. Use quando o usuário disser "preparar a defesa", "montar apresentação do TCC", "slides da defesa", "roteiro da banca", "o que apresentar na defesa". Não é treino de perguntas (isso é tcc-grill) nem parecer do documento (tcc-auditoria-banca) — é a construção da apresentação em si.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# TCC — Defesa

Transforma o TCC escrito em apresentação de defesa. O documento tem ~100
páginas; a banca vê 15–20 minutos. O trabalho desta skill é decidir o que
sobrevive à compressão e em que ordem — não resumir tudo.

Família tcc-*: `tcc-fragmentos` → `tcc-rascunho` → `tcc-revisao-impessoal` →
`tcc-auditoria-banca` → **esta** → `tcc-grill` (treino de perguntas, rodar
depois do roteiro pronto).

## Processo

### 1. Levantar o material

- Ler os capítulos finais (perguntar o path se não achar em
  `**/capitulos-final/` ou `**/projeto-escrito/`).
- Métricas canônicas ficam no `CLAUDE.md` do vault/projeto (fechamento Jun
  2026: 152 commits, 31 sprints, 301 tests, ~50k LOC, 70 migrations, 32 RF,
  11 tabelas). Usar SEMPRE esses números — a banca compara com o texto.
- Perguntar: tempo de fala definido pela FEPI? (assumir 20min se não souber,
  confirmar). Data da defesa? Formato (presencial/remoto, slides obrigatórios?).

### 2. Definir o arco

Arco padrão de defesa (adaptar, não engessar):

1. Problema e contexto (quem sofre, por quê) — curto, a banca leu o texto
2. Objetivos e hipóteses (H1/H2/H3) — literais, como estão no documento
3. Método (por que Pesquisa-Ação + sprints; 1 slide, não capítulo)
4. O que foi construído (demo ou screenshots do SyncClass — o momento forte)
5. Resultados por hipótese (evidência → veredito: confirmada/parcial/refutada)
6. Limitações (falar antes que perguntem — desarma a banca)
7. Conclusão e trabalhos futuros

Regra de tempo: ~1 min por slide. 20 min → 15–18 slides úteis + capa/obrigado.

### 3. Roteiro slide a slide

Para cada slide, entregar:

```
Slide N — <título curto>
Conteúdo: <bullets do que aparece na tela — máximo 4 por slide>
Fala: <2-3 frases do que dizer, linguagem falada, não texto do TCC>
Tempo: <min>
```

- 1 ideia por slide. Slide com dois assuntos vira dois slides ou perde um.
- Números canônicos aparecem UMA vez cada, no slide certo — repetir dilui.
- Figuras do TCC (DER, arquitetura) valem mais que texto: apontar quais capítulos
  têm figuras aproveitáveis.

### 4. O que NÃO apresentar

Listar explicitamente o que fica de fora e por quê (referencial teórico
extenso, detalhes de implementação, tabelas grandes). A banca pergunta sobre
o que está no texto — a apresentação não precisa cobrir tudo, precisa
sustentar a narrativa.

### 5. Ensaio

- Ler o roteiro em voz alta cronometrando — estourou o tempo, cortar slide,
  nunca acelerar a fala.
- Quiz de transição: "o que vem depois do slide de metodologia?" até fluir.
- Fechar oferecendo: "roteiro pronto — quer treinar as perguntas da banca?
  (`/tcc-grill`)".

## Limites

- Não gera o arquivo de slides (PowerPoint/Canva é do autor) — gera o
  **roteiro** que vira slides.
- Não inventa resultados nem números — só o que está nos capítulos e nas
  métricas canônicas.
