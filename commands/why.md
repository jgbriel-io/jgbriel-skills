---
description: Contexto histórico de uma linha ou trecho — git blame + log + último commit que tocou. Útil pra entender intenção original.
argument-hint: "<arquivo>:<linha>  ou  <arquivo> <linha-inicial>-<linha-final>"
allowed-tools: Bash(git blame:*), Bash(git log:*), Bash(git show:*), Read
---

Investigue o contexto histórico do trecho indicado em $ARGUMENTS.

## Parsing do argumento

- Formato 1: `path:linha` (linha única).
- Formato 2: `path linha-inicio linha-fim` ou `path linha-inicio:linha-fim`.
- Formato 3: só `path` → último commit que tocou o arquivo inteiro.

Se ambíguo, pedir formato correto.

## Investigação

1. **`git blame -L start,end <path>`** — quem escreveu cada linha, qual commit.
2. Para o commit mais recente identificado no blame:
   - `git log --oneline -1 <sha>` — mensagem.
   - `git show <sha> --stat` — escopo da mudança.
   - `git show <sha> -- <path>` — diff específico do arquivo.
3. **Histórico do arquivo:** `git log --oneline -5 -- <path>` — últimas 5 mudanças.
4. **Mensagens contextuais:** se algum commit do histórico menciona issue/PR (`#123`), notar.

## Output

```markdown
## Contexto: <path>:<linha>

### Trecho
```
<conteúdo das linhas-alvo (ler arquivo)>
```

### Última mudança neste trecho
- Commit: `<sha curto>` por <autor> em <data>
- Mensagem: <commit subject>
- Contexto: <body do commit, se houver, ou "(sem body)">

### Diff dessa mudança
<saída de git show focada no trecho>

### Histórico recente do arquivo
- `<sha>` — <subject>
- `<sha>` — <subject>
- ...

### Referências externas
- Issues/PRs mencionadas: #N, #M (se houver)
```

Sob 500 palavras. Foco em **intenção** (por que mudou), não só **o quê**.
