---
description: Quebra tarefa em vertical slices independentes — cada slice end-to-end demoable. Foco em entrega incremental, não em camadas.
argument-hint: "<descrição da tarefa>"
allowed-tools: Read, Grep, Glob
---

Quebre a tarefa em vertical slices (tracer-bullet style). Cada slice deve:

- **Cortar todas as camadas** (schema, API, UI, testes) end-to-end.
- **Ser demoable sozinho** — usuário consegue ver algo funcionando.
- **Não depender de slices futuros** pra entregar valor.
- **Caber em ≤1 dia de trabalho** idealmente.

## Briefing pro agent planner (delegar via Task)

```
Quebrar em vertical slices: $ARGUMENTS

Diferente de plano sequencial:
- NÃO é "schema → api → ui → tests" (horizontal).
- É "menor cenário ponta-a-ponta possível → próximo cenário".

Saída esperada:
### Slice 1: <nome curto, descreve cenário usuário>
- O que entrega: <feature visível>
- Camadas tocadas: <files>
- Como verificar: <demonstração end-to-end>
- Tamanho: <S | M | L>

### Slice 2: ...

(...)

### Fora de escopo desta decomposição
- ...
```

## Output

Repasse a decomposição do planner ao usuário. Adicione no fim:

> Quer que eu invoque `/plan <slice X>` para detalhar a implementação de uma slice específica?

Não executar nada.
