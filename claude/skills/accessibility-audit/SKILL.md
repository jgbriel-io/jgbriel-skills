---
name: accessibility-audit
description: Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manual testing, keyboard navigation, color contrast, correct ARIA usage, and screen reader checks. Use when user asks about accessibility, a11y, axe, WCAG, keyboard navigation, screen readers, color contrast, or ARIA attributes.
---

# Auditoria de Acessibilidade (a11y)

Conceito agnóstico de framework de UI: aplica a React, Vue, Angular, Svelte ou HTML puro. Cruza com `forms-validation` para erro de campo acessível — aqui o foco é o restante da superfície de a11y.

## Ferramenta automatizada é piso, não teto

Automatizado (axe-core, Lighthouse, WAVE) pega ~30-40% dos problemas de WCAG — os mecanicamente detectáveis (contraste, `alt` ausente, label ausente, ARIA inválido). O resto (ordem de foco faz sentido, texto alternativo é *descritivo*, leitor de tela anuncia o fluxo de forma compreensível) só teste manual pega.

```
// ❌ CI verde com axe = "acessível", ninguém navega por teclado antes de mergear
test('a11y', async () => {
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
}); // passou, mas o modal prende o foco e ninguém testou

// ✅ axe no CI pega regressão óbvia + checklist manual no fluxo crítico antes do merge
test('a11y automatizado', async () => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
// + checklist manual (teclado, leitor de tela) rodado no PR de fluxo crítico
```

| Camada | O que pega | Quando roda |
|---|---|---|
| Linter (`eslint-plugin-jsx-a11y`, `eslint-plugin-vuejs-accessibility`) | Erro óbvio no código-fonte antes de rodar | Editor/pre-commit |
| axe-core/Lighthouse no CI | Violação de regra WCAG mecanicamente detectável | Toda PR, roda em componente/página renderizada |
| Manual (teclado + leitor de tela) | Ordem de foco, texto alternativo com sentido, anúncio compreensível | Fluxo crítico, antes de mergear/lançar |

Falha de axe no CI bloqueia o merge — não é warning ignorável. Mas CI limpo não é sinal de "pode lançar sem revisar".

## Navegação por teclado

Todo elemento interativo precisa ser alcançável e operável só com teclado — mouse é opcional, teclado não é.

```
// ❌ clique só funciona com mouse, div "parece" botão mas não é focável
<div class="button" onClick={salvar}>Salvar</div>

// ✅ elemento nativo é focável, operável com Enter/Space, tem role correto de graça
<button onClick={salvar}>Salvar</button>
```

- **Tab order**: segue a ordem visual/lógica da tela. `tabindex` positivo (`tabindex="3"`) quebra a ordem natural do DOM — evitar; usar `tabindex="0"` só para tornar focável um elemento não nativo, `tabindex="-1"` para remover do tab order mantendo foco programático possível.
- **Foco visível**: nunca `outline: none` sem substituir por um indicador de foco igual ou mais visível. Foco invisível é inacessível para quem não usa mouse.
- **Sem trap de foco** fora de modal/dialog intencional: usuário precisa conseguir sair de qualquer componente só com Tab/Shift+Tab/Esc.
- **Trap de foco correto em modal**: Tab circula dentro do modal enquanto aberto, Esc fecha e devolve o foco ao elemento que abriu o modal.

```
// ❌ outline removido, nenhum substituto
button:focus { outline: none; }

// ✅ indicador de foco customizado, visível
button:focus-visible { outline: 2px solid var(--focus-color); outline-offset: 2px; }
```

## Contraste de cor

Mínimo WCAG AA: **4.5:1** para texto normal, **3:1** para texto grande (≥18pt ou ≥14pt bold) e para componentes de UI/gráficos (borda de input, ícone informativo).

```
// ❌ cinza claro sobre branco, "parece" elegante mas reprova AA
color: #aaaaaa; background: #ffffff; // ~2.3:1

// ✅ contraste suficiente, checado com ferramenta (não "olhômetro")
color: #595959; background: #ffffff; // ~7:1
```

- Checar com ferramenta (DevTools contrast checker, axe, Stark), não por inspeção visual — o olho humano erra sistematicamente para cores próximas do limite.
- Cor nunca é o único veículo de informação (erro em vermelho sem ícone/texto, gráfico que só diferencia por matiz) — quem tem daltonismo ou usa modo alto contraste perde o sinal.

## ARIA: semântica nativa primeiro

> "No ARIA is better than bad ARIA" — ARIA não muda comportamento nem estilo, só a árvore de acessibilidade exposta ao leitor de tela. ARIA errado mente para quem depende dela.

```
// ❌ ARIA por cima de elemento genérico quando existe elemento nativo
<div role="button" onClick={enviar}>Enviar</div>
// falta: focável por Tab, ativável por Enter/Space, tudo isso o navegador dá de graça pro <button>

// ✅ elemento nativo primeiro — zero ARIA necessário
<button onClick={enviar}>Enviar</button>
```

| Regra | Exemplo |
|---|---|
| Elemento nativo com semântica embutida sempre vence ARIA + `div`/`span` | `<button>`, `<a href>`, `<nav>`, `<label>`, `<table>` em vez de recriar com `role` |
| ARIA só quando não há elemento HTML nativo equivalente | Combobox custom, tab panel custom, tooltip custom |
| Nunca alterar semântica que o elemento nativo já tem certo | `<button role="link">` é raramente correto — se precisa navegar, use `<a>` |
| `aria-label`/`aria-labelledby` só quando não há texto visível suficiente | Botão de ícone sem texto (`<button aria-label="Fechar"><IconX /></button>`) |
| `aria-live` para conteúdo que muda sem interação direta do usuário | Toast, contador, mensagem de status assíncrona |

## Leitor de tela como teste manual mínimo

Automatizado não ouve o fluxo. Rodar ao menos uma vez por fluxo crítico (login, checkout, formulário principal) com um leitor de tela real:

| Plataforma | Leitor de tela |
|---|---|
| Windows | NVDA (gratuito) ou Narrator |
| macOS/iOS | VoiceOver (nativo) |
| Android | TalkBack (nativo) |
| Linux | Orca |

Checar: nome do elemento é anunciado (não "botão", "link", "imagem" sem contexto), estado é anunciado (`aria-expanded`, `aria-selected`, `aria-invalid`), e a ordem de leitura corresponde à ordem visual/lógica.

```
// ❌ imagem informativa sem alt — leitor de tela pula ou lê o nome do arquivo
<img src="grafico-vendas-q3.png" />

// ✅ alt descreve o conteúdo/função da imagem; decorativa usa alt vazio (não omitido)
<img src="grafico-vendas-q3.png" alt="Vendas cresceram 20% no Q3 comparado ao Q2" />
<img src="borda-decorativa.png" alt="" />
```

## Formulário acessível (resumo — detalhe em `forms-validation`)

- Todo input tem `<label>` associado (`for`/`id` ou wrapping) — placeholder não substitui label.
- Erro de campo usa `aria-invalid` + `aria-describedby` apontando para a mensagem de erro.
- Campo obrigatório marcado com `required`/`aria-required`, não só asterisco visual.

## Checklist

- [ ] axe-core (ou equivalente) rodando no CI, falha bloqueia merge
- [ ] Todo elemento interativo é alcançável e operável só com teclado
- [ ] Ordem de tab segue a ordem visual/lógica, sem `tabindex` positivo
- [ ] Indicador de foco visível em todo elemento focável (nunca `outline: none` sem substituto)
- [ ] Modal/dialog tem trap de foco intencional, Esc fecha e devolve foco à origem
- [ ] Contraste de texto ≥ 4.5:1 (normal) / 3:1 (grande e componentes de UI), checado com ferramenta
- [ ] Cor nunca é o único veículo de informação
- [ ] Elemento HTML nativo usado antes de recriar semântica com `role`/ARIA
- [ ] `alt` presente em toda imagem (descritivo se informativa, vazio se decorativa)
- [ ] Fluxo crítico testado manualmente com pelo menos um leitor de tela real
- [ ] Todo input de formulário tem label associado e erro anunciado via `aria-invalid`/`aria-describedby`

## Exemplos por stack

**React** — teste automatizado com jest-axe:
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('tela de checkout não tem violação de a11y', async () => {
  const { container } = render(<Checkout />);
  expect(await axe(container)).toHaveNoViolations();
});
```

**Vue** — `eslint-plugin-vuejs-accessibility` + axe em teste de componente:
```js
// eslint.config.js
import vueA11y from 'eslint-plugin-vuejs-accessibility';
export default [{ plugins: { 'vuejs-accessibility': vueA11y }, rules: vueA11y.configs.recommended.rules }];
```

**Angular** — CDK a11y para foco e navegação:
```ts
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

const trap: FocusTrap = this.focusTrapFactory.create(this.modalRef.nativeElement);
trap.focusInitialElement();
```

**Qualquer stack (E2E)** — Playwright + `@axe-core/playwright`:
```ts
import AxeBuilder from '@axe-core/playwright';

test('página inicial é acessível', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Anti-patterns

- ❌ CI verde no axe tratado como "acessível", sem nenhum teste manual em fluxo crítico
- ❌ `outline: none` sem indicador de foco substituto
- ❌ `<div onClick>`/`<span onClick>` no lugar de `<button>`/`<a>` nativo
- ❌ `role`/ARIA adicionado a um elemento que já tem semântica nativa correta
- ❌ `tabindex` positivo alterando a ordem natural do DOM
- ❌ Cor como único diferenciador de estado/erro/categoria
- ❌ Contraste avaliado "no olho" em vez de medido com ferramenta
- ❌ Imagem informativa sem `alt`, ou `alt` decorativo ausente (deve ser vazio, não omitido)
- ❌ Modal sem trap de foco, ou trap de foco que nunca devolve o foco de origem ao fechar
- ❌ Placeholder usado como substituto de `<label>`
