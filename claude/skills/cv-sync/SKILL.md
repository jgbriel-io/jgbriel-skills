---
name: cv-sync
description: Pipeline de atualização do currículo — edita os .tex canônicos, recompila com pdflatex, renomeia para os nomes de distribuição, copia para o site jgbriel.dev e D:\documentos\pessoais, commita (deploy automático), verifica produção e registra release no vault. Use quando o usuário disser "atualiza o cv", "cv-sync", "muda X no currículo", "recompila o currículo", "sobe o cv novo", "troca o pdf do site", ou pedir qualquer alteração de conteúdo nos CVs. Não é otimização de conteúdo por vaga (isso é resume-tailor/job-description-analyzer) — é o pipeline fonte → PDF → site → vault.
---

# cv-sync

Um comando, ciclo completo: .tex → PDF → pasta pessoal → site → produção → vault.

## Fontes e destinos

| O quê | Onde |
|---|---|
| Fonte canônica (.tex) | `D:/Projetos/projetos-pessoais/jgbriel-dev/resumes-src/cv-pt.tex` e `cv-en.tex` |
| PDF distribuição PT | `Joao-Gabriel-Caetano-CV.pdf` |
| PDF distribuição EN | `Joao-Gabriel-Caetano-Resume.pdf` |
| Site (servido pelo botão) | `D:/Projetos/projetos-pessoais/jgbriel-dev/public/resumes/` |
| Cópia pessoal | `D:/documentos/pessoais/` |
| Espelho vault | `wiki/Professional/Currículo.md` |
| Runbook/releases | `wiki/Projetos/Pessoais/jgabriel.dev/deployment/jgabriel.dev - Deploy.md` |

`resumes-src/` fica fora de `public/` de propósito: fonte versionada no git, nunca servida.

## Regras de conteúdo

Da memória `feedback-textos-profissionais` — aplicar antes de propor qualquer texto:

1. Sem travessão (em dash). Vírgula, dois-pontos, parênteses ou ponto-e-vírgula.
2. PostgreSQL, não Supabase, em resumo/headline. Supabase só em Habilidades e stack de projeto.
3. Métricas voláteis com qualificador: "cerca de 200 containers", "100+ deploys", "múltiplos ambientes". Nunca cravar número exato volátil.
4. 1 página, sempre. EN define layout, PT encurta texto.
5. Título B2ML no CV: "Analista de TI Júnior" (oficial). Título funcional é só no LinkedIn.
6. E-mail oficial; JLAC fora do CV.

Mudança de conteúdo aplica nos DOIS .tex (PT e EN espelhados) e no espelho do vault.

## Pipeline

### 1. Editar

Aplicar a mudança pedida em `cv-pt.tex` e `cv-en.tex`. Se a mudança afeta texto que também existe nas páginas de LinkedIn do vault, avisar o usuário (não editar LinkedIn automaticamente — escopo é CV).

### 2. Compilar

```bash
PDFLATEX="$LOCALAPPDATA/Programs/MiKTeX/miktex/bin/x64/pdflatex.exe"
cd /d/Projetos/projetos-pessoais/jgbriel-dev/resumes-src
"$PDFLATEX" -interaction=nonstopmode -enable-installer cv-pt.tex 2>&1 | tail -3
"$PDFLATEX" -interaction=nonstopmode -enable-installer cv-en.tex 2>&1 | tail -3
```

Verificar `(1 page` na saída de ambos. Se sair 2 páginas, parar e cortar conteúdo com o usuário antes de seguir. Limpar auxiliares: `rm -f *.aux *.log *.out`.

### 3. Renomear e distribuir

```bash
cd /d/Projetos/projetos-pessoais/jgbriel-dev/resumes-src
mv -f cv-pt.pdf Joao-Gabriel-Caetano-CV.pdf
mv -f cv-en.pdf Joao-Gabriel-Caetano-Resume.pdf
cp -f Joao-Gabriel-Caetano-*.pdf ../public/resumes/
mv -f Joao-Gabriel-Caetano-*.pdf /d/documentos/pessoais/
```

### 4. Commit e deploy

Confirmar com o usuário antes do push (produção). Working tree deve estar limpo além dos arquivos do CV.

```bash
cd /d/Projetos/projetos-pessoais/jgbriel-dev
git add resumes-src/ public/resumes/
git commit -m "chore: update resume (<resumo da mudança em 1 frase>)"
git push origin main
```

Push em `main` dispara GitHub Actions → Cloudflare Pages. Acompanhar com `gh run watch` em background.

### 5. Verificar produção

Content-Length de `https://jgbriel.dev/resumes/<nome>.pdf` deve bater com o tamanho do arquivo local (byte a byte). Se context-mode ativo, usar ctx_execute; senão curl -sI. Cache do Cloudflare pode segurar versão velha por alguns minutos — repetir uma vez antes de concluir falha.

### 6. Registrar

- Apender linha na tabela `## Releases` do runbook: `| YYYY-MM-DD | <sha curto> | <mudança em 1 frase> |`
- Sincronizar `wiki/Professional/Currículo.md` com o novo conteúdo
- Atualizar `updated:` do frontmatter nas duas páginas

## Modo rápido

"Recompila o cv" sem mudança de conteúdo = pular passo 1, rodar 2→6. Se os .tex não mudaram desde o último commit, avisar que produção já está atual e perguntar se quer forçar.
