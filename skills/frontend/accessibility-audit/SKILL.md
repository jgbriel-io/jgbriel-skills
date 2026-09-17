---
name: accessibility-audit
description: Guides accessibility (a11y) auditing — automated tooling (axe-core) wired into CI as a floor not a substitute for manual testing, keyboard navigation, color contrast, correct ARIA usage, and screen reader checks. Use when user asks about accessibility, a11y, axe, WCAG, keyboard navigation, screen readers, color contrast, or ARIA attributes.
---

# Accessibility Audit

A UI-framework-agnostic concept: it applies to React, Vue, Angular, Svelte or
plain HTML. It crosses `forms-validation` for accessible field errors; the focus
here is the rest of the a11y surface.

## Automated tooling is the floor, not the ceiling

Automated tools — axe-core, Lighthouse, WAVE — catch roughly 30 to 40% of WCAG
problems: the mechanically detectable ones (contrast, missing `alt`, missing
label, invalid ARIA). The rest — whether the focus order makes sense, whether
alternative text is actually *descriptive*, whether a screen reader announces the
flow comprehensibly — only manual testing catches.

```
// ❌ Green CI on axe read as "accessible", with nobody using a keyboard before merge
test('a11y', async () => {
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
}); // it passed, and the modal traps focus, and nobody checked

// ✅ axe in CI catches obvious regressions; a manual checklist covers the critical flow
test('automated a11y', async () => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
// plus the manual checklist (keyboard, screen reader) run on the critical-flow PR
```

| Layer | What it catches | When it runs |
|---|---|---|
| Linter (`eslint-plugin-jsx-a11y`, `eslint-plugin-vuejs-accessibility`) | Obvious source-level mistakes, before anything runs | Editor and pre-commit |
| axe-core/Lighthouse in CI | Mechanically detectable WCAG violations | Every PR, against the rendered component or page |
| Manual (keyboard plus screen reader) | Focus order, meaningful alternative text, comprehensible announcements | Critical flows, before merge or release |

An axe failure in CI blocks the merge; it is not an ignorable warning. But clean
CI is not permission to ship without review.

## Keyboard navigation

Every interactive element must be reachable and operable with the keyboard alone.
A mouse is optional; a keyboard is not.

```
// ❌ Only works with a mouse: the div looks like a button and is not focusable
<div class="button" onClick={save}>Salvar</div>

// ✅ The native element is focusable, works with Enter and Space, and gets the right role for free
<button onClick={save}>Salvar</button>
```

- **Tab order** follows the screen's visual and logical order. A positive `tabindex`
  (`tabindex="3"`) breaks the DOM's natural order — avoid it. Use `tabindex="0"`
  only to make a non-native element focusable, and `tabindex="-1"` to remove
  something from the tab order while keeping programmatic focus possible.
- **Visible focus**: never `outline: none` without replacing it with an equally
  visible indicator. Invisible focus is inaccessible to anyone not using a mouse.
- **No focus trap** outside an intentional modal or dialog: the user must be able to
  leave any component with Tab, Shift+Tab or Esc.
- **A correct trap inside a modal**: Tab cycles within it while open, Esc closes it
  and returns focus to whatever opened it.

```
// ❌ The outline removed with nothing in its place
button:focus { outline: none; }

// ✅ A custom, visible focus indicator
button:focus-visible { outline: 2px solid var(--focus-color); outline-offset: 2px; }
```

## Colour contrast

WCAG AA minimums: **4.5:1** for normal text, **3:1** for large text (≥18pt, or
≥14pt bold) and for UI components and graphics — an input border, an informative
icon.

```
// ❌ Light grey on white: it looks elegant and fails AA
color: #aaaaaa; background: #ffffff; // ~2.3:1

// ✅ Sufficient contrast, measured with a tool rather than by eye
color: #595959; background: #ffffff; // ~7:1
```

- Measure it (DevTools' contrast checker, axe, Stark) rather than judging visually.
  The eye errs systematically for colours near the threshold.
- Colour is never the only carrier of information. An error shown in red with no
  icon or text, a chart distinguished only by hue — anyone colourblind, or using
  high-contrast mode, loses the signal.

## ARIA: native semantics first

> "No ARIA is better than bad ARIA." ARIA changes neither behaviour nor style, only
> the accessibility tree exposed to a screen reader. Wrong ARIA lies to the people
> who depend on it.

```
// ❌ ARIA layered on a generic element when a native one exists
<div role="button" onClick={submit}>Enviar</div>
// missing: Tab focus, Enter/Space activation — all of which the browser gives <button> free

// ✅ The native element first, with no ARIA needed
<button onClick={submit}>Enviar</button>
```

| Rule | Example |
|---|---|
| A native element with built-in semantics always beats ARIA on a `div` or `span` | `<button>`, `<a href>`, `<nav>`, `<label>`, `<table>` rather than recreating them with `role` |
| ARIA only where no native HTML equivalent exists | A custom combobox, tab panel or tooltip |
| Never override semantics the native element already has right | `<button role="link">` is rarely correct; if it navigates, use `<a>` |
| `aria-label`/`aria-labelledby` only where visible text is insufficient | An icon-only button (`<button aria-label="Fechar"><IconX /></button>`) |
| `aria-live` for content that changes without direct user interaction | A toast, a counter, an async status message |

## Screen readers as the minimum manual test

Automation does not listen to the flow. Run each critical flow — login, checkout,
the main form — through a real screen reader at least once:

| Platform | Screen reader |
|---|---|
| Windows | NVDA (free) or Narrator |
| macOS/iOS | VoiceOver (built in) |
| Android | TalkBack (built in) |
| Linux | Orca |

Check that: the element's name is announced (not a bare "button", "link" or
"image"), its state is announced (`aria-expanded`, `aria-selected`,
`aria-invalid`), and the reading order matches the visual and logical order.

```
// ❌ An informative image with no alt — the screen reader skips it or reads the filename
<img src="grafico-vendas-q3.png" />

// ✅ alt describes the content or function; a decorative image uses an empty alt, never a missing one
<img src="grafico-vendas-q3.png" alt="Vendas cresceram 20% no Q3 comparado ao Q2" />
<img src="borda-decorativa.png" alt="" />
```

Interface strings stay in Portuguese, because the product's users read them.

## Accessible forms (summary — the detail is in `forms-validation`)

- Every input has an associated `<label>` (through `for`/`id` or by wrapping). A
  placeholder is not a label.
- Field errors use `aria-invalid` plus `aria-describedby` pointing at the message.
- Required fields are marked with `required`/`aria-required`, not only a visual
  asterisk.

## Checklist

- [ ] axe-core or equivalent runs in CI, and a failure blocks the merge
- [ ] Every interactive element is reachable and operable by keyboard alone
- [ ] Tab order follows the visual and logical order, with no positive `tabindex`
- [ ] A visible focus indicator on every focusable element; never `outline: none` with no replacement
- [ ] Modals and dialogs trap focus intentionally, and Esc closes and returns focus to the opener
- [ ] Text contrast ≥ 4.5:1 (normal) or 3:1 (large text and UI components), measured with a tool
- [ ] Colour is never the only carrier of information
- [ ] A native HTML element is used before semantics are recreated with `role`/ARIA
- [ ] Every image has `alt` — descriptive when informative, empty when decorative
- [ ] Critical flows tested manually with at least one real screen reader
- [ ] Every form input has an associated label, with errors announced through `aria-invalid`/`aria-describedby`

## By stack

**React** — automated testing with jest-axe:
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('the checkout screen has no a11y violations', async () => {
  const { container } = render(<Checkout />);
  expect(await axe(container)).toHaveNoViolations();
});
```

**Vue** — `eslint-plugin-vuejs-accessibility` plus axe in component tests:
```js
// eslint.config.js
import vueA11y from 'eslint-plugin-vuejs-accessibility';
export default [{ plugins: { 'vuejs-accessibility': vueA11y }, rules: vueA11y.configs.recommended.rules }];
```

**Angular** — the CDK's a11y utilities for focus and navigation:
```ts
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

const trap: FocusTrap = this.focusTrapFactory.create(this.modalRef.nativeElement);
trap.focusInitialElement();
```

**Any stack (E2E)** — Playwright plus `@axe-core/playwright`:
```ts
import AxeBuilder from '@axe-core/playwright';

test('the home page is accessible', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Anti-patterns

- ❌ Green axe CI treated as "accessible", with no manual test of a critical flow
- ❌ `outline: none` with no replacement focus indicator
- ❌ `<div onClick>` or `<span onClick>` where a native `<button>` or `<a>` belongs
- ❌ `role` or ARIA added to an element that already has the right native semantics
- ❌ A positive `tabindex` reordering the DOM's natural flow
- ❌ Colour as the only differentiator of state, error or category
- ❌ Contrast judged by eye instead of measured
- ❌ An informative image with no `alt`, or a decorative one missing its empty `alt`
- ❌ A modal with no focus trap, or one that never returns focus to its opener
- ❌ A placeholder standing in for a `<label>`
