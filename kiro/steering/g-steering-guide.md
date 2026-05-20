---
inclusion: manual
description: Como criar e manter steering files — convenções de nomenclatura, front matter e tipos de inclusão
---

# Steering Files — Como Criar e Manter

Arquivos em `.kiro/steering/` que injetam contexto e regras automaticamente nas conversas com o Kiro.

## Convenção de Nomenclatura

```
g-*.md  →  regras genéricas, reutilizáveis (boas práticas técnicas)
p-*.md  →  regras do projeto (contexto e convenções específicas)
```

**Escopo:**
- `g-*.md` no escopo global (`~/.kiro/steering/`) — válido para todos os projetos
- `p-*.md` no escopo do projeto (`<projeto>/.kiro/steering/`) — específico do projeto

## Front Matter Obrigatório

```yaml
---
inclusion: always          # sempre incluído em todo contexto
description: Descrição curta do que este arquivo cobre
---
```

```yaml
---
inclusion: fileMatch       # incluído quando arquivo específico está aberto
fileMatchPattern: ['**/*.tsx', 'src/hooks/**']
description: ...
---
```

```yaml
---
inclusion: manual          # só incluído quando referenciado explicitamente no chat
description: ...
---
```

## Quando Usar Cada Tipo

- `always` — contexto do projeto, comportamento do assistente, regras de segurança transversais
- `fileMatch` — regras de tecnologia específica (frontend só quando editando `.tsx`, banco só em hooks/migrations)
- `manual` — guias de referência longos, checklists opcionais, documentação que não precisa estar sempre carregada

## Boas Práticas

1. **Identificar escopo:** genérico (`g-`) ou específico do projeto (`p-`)
2. **Escolher `inclusion` correto** baseado em quando o conteúdo é útil
3. **Sempre incluir `description`** no front matter (obrigatório)
4. **Conteúdo denso** com exemplos de código reais
5. **Não duplicar** — verificar se algo similar já existe antes de criar
6. **Generalizar exemplos** em `g-*.md` — usar `User`, `Resource`, `Order` em vez de domínio do projeto

## Anti-patterns

- ❌ `g-*.md` com refs project-specific (`teacher_id`, `student_name`)
- ❌ `p-*.md` no escopo global
- ❌ Vários arquivos cobrindo o mesmo tópico
- ❌ Arquivos sem `description` no front matter
- ❌ `inclusion: always` para conteúdo longo raramente relevante (polui contexto)
