---
name: cv-sync
description: The resume pipeline — edit the canonical .tex files, recompile, distribute to the site and the vault, commit, and verify production. Use when the user says "atualiza o cv", "cv-sync", "muda X no currículo", "sobe o cv novo", or asks for any content change to the CVs. Tailoring content to one job posting is resume-tailor.
---

# cv-sync

One command, the whole cycle: .tex → PDF → personal folder → site → production →
vault.

**Windows only.** The pipeline depends on MiKTeX and on the `D:` and `/d/` drives.
On another machine, say so and stop — there is no useful halfway here.

## Sources and destinations

| What | Where |
|---|---|
| Canonical source (.tex) | `resumes-src/cv-pt.tex` and `cv-en.tex` in the personal site repo |
| Distribution PDF, PT | `Joao-Gabriel-Caetano-CV.pdf` |
| Distribution PDF, EN | `Joao-Gabriel-Caetano-Resume.pdf` |
| Site (what the download button serves) | `public/resumes/` in the same repo |
| Personal copy | the documents folder on `D:` |
| Vault mirror | `wiki/Professional/Currículo.md` |
| Runbook and releases | the site's deployment page in the vault |

The repo path itself lives in `~/.claude/projects-map.md`, outside this
repository. `resumes-src/` sits outside `public/` on purpose: the source is
versioned in git and never served.

## Content rules

Read the `feedback-textos-profissionais` memory **before proposing any text**. It
holds the user's fixed rules for writing about himself: punctuation, how the stack
is named, how a volatile metric is qualified, length, and what belongs on which
channel. Those are personal preferences rather than public convention, which is
why they live in memory and not in this repository.

A content change applies to BOTH .tex files — PT and EN are mirrored — and to the
vault mirror.

## Pipeline

### 1. Edit

Apply the requested change to `cv-pt.tex` and `cv-en.tex`. If it also affects text
living on the vault's LinkedIn pages, tell the user; do not edit LinkedIn
automatically, since the scope here is the CV.

### 2. Compile

```bash
PDFLATEX="$LOCALAPPDATA/Programs/MiKTeX/miktex/bin/x64/pdflatex.exe"
cd <site repo>/resumes-src
"$PDFLATEX" -interaction=nonstopmode -enable-installer cv-pt.tex 2>&1 | tail -3
"$PDFLATEX" -interaction=nonstopmode -enable-installer cv-en.tex 2>&1 | tail -3
```

Check for `(1 page` in both outputs. If either runs to two pages, stop and cut
content with the user before going on. Clean up the auxiliaries:
`rm -f *.aux *.log *.out`.

### 3. Rename and distribute

```bash
cd <site repo>/resumes-src
mv -f cv-pt.pdf Joao-Gabriel-Caetano-CV.pdf
mv -f cv-en.pdf Joao-Gabriel-Caetano-Resume.pdf
cp -f Joao-Gabriel-Caetano-*.pdf ../public/resumes/
mv -f Joao-Gabriel-Caetano-*.pdf /d/documentos/pessoais/
```

### 4. Commit and deploy

Confirm with the user before pushing, because the push is production. The working
tree must be clean apart from the CV files.

```bash
cd <site repo>
git add resumes-src/ public/resumes/
git commit -m "chore: update resume (<one-sentence summary of the change>)"
git push origin main
```

A push to `main` triggers GitHub Actions and then Cloudflare Pages. Follow it with
`gh run watch` in the background.

### 5. Verify production

The `Content-Length` of `https://jgbriel.dev/resumes/<name>.pdf` must match the
local file byte for byte. Use `ctx_execute` when context-mode is available,
otherwise `curl -sI`. Cloudflare's cache can hold the old version for a few
minutes, so repeat once before reporting a failure.

### 6. Record

- Append a row to the runbook's `## Releases` table:
  `| YYYY-MM-DD | <short sha> | <one-sentence change> |`. Resolve the page by
  globbing the vault rather than writing the path from memory: the domain is
  spelled two ways across the older pages, and a wrong path becomes a ghost page.
- Sync `wiki/Professional/Currículo.md` with the new content.
- Update the `updated:` frontmatter on both pages.

## Quick mode

"Recompila o cv" with no content change means skipping step 1 and running 2
through 6. If the .tex files have not changed since the last commit, say that
production is already current and ask whether to force it anyway.
