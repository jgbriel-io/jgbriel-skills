---
name: forms-validation
description: Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, phone, CEP) validated by checksum, not just format, plus field-level vs form-level error UX. Use when user asks about form validation, input masks, CPF/CNPJ/CEP validation, or building forms in React, Vue, Angular, Svelte or similar.
---

# Forms and Validation

A UI-framework-agnostic concept: one validation schema, reused between client and
server, plus per-field error handling. General component and state conventions
live in `frontend-conventions`; the focus here is forms.

## The schema is the single source of truth

An error that does not belong to a field — a network failure, a 500, a permission
denial covering the whole screen — is `error-ux`. This skill is about what the
user typed.

The client validates to give fast feedback (UX). The server validates because it
never trusts the client (security) — see `input-validation`. Those two validations
cannot be two separately written rule sets: they diverge over time, and one side
silently goes stale.

```
// ❌ The rule duplicated, and already diverging
// client: minimum age 18
// server: minimum age 16 (nobody updated both)

// ✅ One schema, two executions
schema = defineSchema({ age: number().min(18) })
client.validate(schema, formData)    // immediate feedback
server.validate(schema, requestBody) // the source of truth
```

Where to put the schema so both sides can use it:

| Situation | Where the schema lives |
|---|---|
| Monorepo (frontend and backend together) | A shared package (`packages/schemas`), imported by both |
| Separate repos | Replicated by hand plus a contract test, or generated from one source (OpenAPI, JSON Schema) |
| Frontend consuming a third-party API | The client validates with its own schema; the server, outside your control, validates its own. Not the same source, but the client still must not trust the response shape blindly |

Where the literal schema cannot be shared, at least the rules — required fields,
formats, ranges — must be mirrored on both sides, rather than "looking about
right".

## Two layers of validation

- **Synchronous** (per keystroke or on blur): format, required fields, ranges.
  Cheap, and it runs on the client.
- **Asynchronous** (on submit, or debounced): uniqueness — this email already
  exists, this CPF is already registered — and any rule depending on server state.

```
// ❌ Blocking the field on a round trip per keystroke
onKeyUp: () => checkEmailExists(value)

// ✅ Synchronous while typing, asynchronous on blur or submit
onChange: () => validateFormat(value)
onBlur: () => checkEmailExists(value) // debounced
```

## Localised masks (Brazilian market)

A mask is presentation only. Real validation checks the **check digit**, not
merely that the format matches.

```
// ❌ Format regex alone — accepts a CPF whose check digits are wrong
/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)

// ✅ Strip to digits, validate the check digit; the format is only for display
isValidCPF(onlyDigits(value))
```

The CPF algorithm — the same shape applies to CNPJ with different weights:

```
function isValidCPF(cpf):
  digits = onlyDigits(cpf)
  if length(digits) != 11: return false
  if allSameDigit(digits): return false // "11111111111" passes the regex and is invalid

  d1 = calcCheckDigit(digits[0:9], weights=[10,9,8,7,6,5,4,3,2])
  d2 = calcCheckDigit(digits[0:9] + d1, weights=[11,10,9,8,7,6,5,4,3,2])

  return digits[9:11] == [d1, d2]
```

| Field | Real validation, beyond a format regex |
|---|---|
| CPF | Check digits (mod 11, two digits), and reject repeated sequences (`000...`, `111...`) |
| CNPJ | Check digits (mod 11 with its own weights), and reject repeated sequences |
| Phone | A valid area code (the existing 11–99 list), 8 or 9 digits depending on the code and whether it is mobile |
| CEP | Format `00000-000`. Real existence needs a postcode service (ViaCEP or similar); there is no check digit to verify |

Never reimplement that calculation in each form. Centralise it in a validators
module (`validators/cpf.ts`, `validators/cnpj.ts`) and import it from the schema.

## Field errors vs form errors

```
// ❌ One generic error block at the top of the form
<div class="error">Erro ao enviar formulário</div>

// ✅ A specific error anchored to its field, plus a form-level error only when no field is to blame
<Field name="email" error={errors.email} />      // "E-mail inválido"
<Field name="cpf" error={errors.cpf} />          // "CPF inválido"
<FormError message={errors._form} />             // "Erro ao salvar. Tente novamente."
```

- Field error: the specific rule that failed (`obrigatório`, `formato inválido`,
  `CPF inválido`), shown next to the input and wired through `aria-describedby`
  and `aria-invalid`.
- Form error (`_form`/`root`): reserved for failures belonging to no field — a
  network error, a 500, a generic conflict.
- A 422 from the server carrying per-field detail (see `input-validation`) is
  mapped back onto the form's fields, rather than collapsing into one generic
  message.

```
// ✅ Map the server's field errors ({ fields: [{ path, message }] }) back onto the form
response.error.fields.forEach(({ path, message }) => form.setFieldError(path, message))
```

## Checklist

- [ ] The validation schema is one definition used by client and server, or mirrored with a contract test
- [ ] CPF and CNPJ validate check digits, not just a format regex
- [ ] Phone and CEP validate their format, and the mask is stripped before sending to the server
- [ ] Field errors appear next to the input, with the message of the rule that failed
- [ ] The form-level error (`_form`) is used only for failures with no specific field
- [ ] A 422 with per-field detail is remapped onto the fields rather than becoming a generic message
- [ ] The submit button disables or shows loading while the request is in flight, preventing a double submit
- [ ] Required fields are marked visually and through `required`/`aria-required`

## By stack

**React Hook Form + Zod** (the reference stack)
```tsx
const schema = z.object({
  email: z.string().email('E-mail inválido'),
  cpf: z.string().refine(isValidCPF, 'CPF inválido'),
});

const { register, handleSubmit, setError, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  const res = await api.post('/users', data);
  if (!res.ok) {
    res.error.fields?.forEach(f => setError(f.path, { message: f.message }));
  }
};

<input {...register('cpf')} aria-invalid={!!errors.cpf} />
{errors.cpf && <span role="alert">{errors.cpf.message}</span>}
```

**Vue + VeeValidate + Zod**
```vue
<script setup>
const schema = toTypedSchema(z.object({
  cpf: z.string().refine(isValidCPF, 'CPF inválido'),
}));
const { defineField, errors, handleSubmit } = useForm({ validationSchema: schema });
const [cpf, cpfAttrs] = defineField('cpf');
</script>

<template>
  <input v-model="cpf" v-bind="cpfAttrs" :aria-invalid="!!errors.cpf" />
  <span role="alert" v-if="errors.cpf">{{ errors.cpf }}</span>
</template>
```

**Angular Reactive Forms**
```ts
function cpfValidator(control: AbstractControl): ValidationErrors | null {
  return isValidCPF(control.value) ? null : { invalidCpf: true };
}

form = this.fb.group({
  cpf: ['', [Validators.required, cpfValidator]],
});
```
```html
<input formControlName="cpf" [attr.aria-invalid]="form.get('cpf')?.invalid" />
<span role="alert" *ngIf="form.get('cpf')?.errors?.['invalidCpf']">CPF inválido</span>
```

The user-facing messages stay in Portuguese: the product's users read them.

## Anti-patterns

- ❌ The validation rule written separately on client and server, so they drift
- ❌ Validating CPF or CNPJ by format regex alone, with no check digit
- ❌ One generic error block at the top of the form instead of per-field errors
- ❌ Sending the masked value (`123.456.789-00`) to the server instead of digits
- ❌ Reimplementing the check-digit calculation in every form or project
- ❌ Ignoring the server's per-field detail and showing a generic error
- ❌ Allowing repeated submits while a request is in flight
- ❌ Treating "the form validated" as a reason to skip server-side validation
