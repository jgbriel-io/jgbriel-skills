---
name: forms-validation
description: Defines form validation as a single schema shared between client and server, with Brazilian document masks (CPF, CNPJ, phone, CEP) validated by checksum, not just format, plus field-level vs form-level error UX. Use when user asks about form validation, input masks, CPF/CNPJ/CEP validation, or building forms in React, Vue, Angular, Svelte or similar.
---

# Formulários e Validação

Conceito agnóstico de framework de UI: schema único de validação, reaproveitado entre client e server, mais tratamento de erro por campo. Convenções gerais de componente/estado ficam em `frontend-conventions`; aqui o foco é forms.

## Princípio: schema é fonte única de verdade

O client valida para dar feedback rápido (UX). O server valida porque nunca confia no client (segurança) — ver skill `input-validation`. As duas validações não podem ser regras escritas duas vezes: divergem com o tempo e um dos lados fica desatualizado.

```
// ❌ Regra duplicada e divergente
// client: idade mínima 18
// server: idade mínima 16 (ninguém atualizou os dois)

// ✅ Um schema, duas execuções
schema = defineSchema({ age: number().min(18) })
client.validate(schema, formData)   // feedback imediato
server.validate(schema, requestBody) // fonte da verdade
```

Onde colocar o schema para reaproveitar:

| Cenário | Onde mora o schema |
|---|---|
| Monorepo (front + back no mesmo repo) | Pacote compartilhado (`packages/schemas`), importado dos dois lados |
| Repos separados | Schema replicado manualmente + teste de contrato, ou gerado a partir de um schema único (OpenAPI/JSON Schema) |
| Front consome API de terceiro | Client valida com o schema próprio; server (fora do seu controle) valida o dele — não é a mesma fonte, mas o client ainda não deve confiar cegamente no shape da resposta |

Se não dá pra compartilhar o schema literal, pelo menos as regras (obrigatoriedade, formato, range) precisam ser espelhadas nos dois lados — não só "parece que bate".

## Validação em duas camadas

- **Sincronismo** (a cada tecla/blur): formato, obrigatoriedade, range — barato, roda no client
- **Assíncrona** (on submit ou debounced): unicidade (email já existe, CPF já cadastrado), regra que depende de estado do servidor

```
// ❌ Bloquear o campo esperando round-trip a cada tecla
onKeyUp: () => checkEmailExists(value)

// ✅ Validação síncrona no digitar, assíncrona no blur/submit
onChange: () => validateFormat(value)
onBlur: () => checkEmailExists(value) // debounced
```

## Máscaras localizadas (mercado brasileiro)

Máscara é só apresentação (formatação visual). Validação de verdade checa o **dígito verificador**, não apenas se o formato bate.

```
// ❌ Só regex de formato — aceita CPF com dígitos verificadores errados
/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)

// ✅ Extrai só números, valida dígito verificador, formato é só exibição
isValidCPF(onlyDigits(value))
```

Algoritmo de CPF (mesma lógica vale para CNPJ com pesos diferentes):

```
function isValidCPF(cpf):
  digits = onlyDigits(cpf)
  if length(digits) != 11: return false
  if allSameDigit(digits): return false // "11111111111" passa no regex, é inválido

  d1 = calcCheckDigit(digits[0:9], weights=[10,9,8,7,6,5,4,3,2])
  d2 = calcCheckDigit(digits[0:9] + d1, weights=[11,10,9,8,7,6,5,4,3,2])

  return digits[9:11] == [d1, d2]
```

| Campo | Validação real (além de regex de formato) |
|---|---|
| CPF | Dígito verificador (módulo 11, 2 dígitos), rejeitar sequências repetidas (`000...`, `111...`) |
| CNPJ | Dígito verificador (módulo 11 com pesos próprios), rejeitar sequências repetidas |
| Telefone | DDD válido (lista de 11-99 existentes), 8 ou 9 dígitos conforme DDD/celular |
| CEP | Formato `00000-000`; existência real só via consulta a serviço de CEP (ViaCEP ou similar), não dá para checar dígito verificador — não existe |

Nunca reimplementar esse cálculo em cada formulário — centralizar em uma função/módulo de validadores (`validators/cpf.ts`, `validators/cnpj.ts`) e importar do schema.

## Erro de campo vs erro geral do formulário

```
// ❌ Um único bloco de erro genérico no topo do form
<div class="error">Erro ao enviar formulário</div>

// ✅ Erro específico ancorado no campo + erro geral só quando não há campo culpado
<Field name="email" error={errors.email} />      // "E-mail inválido"
<Field name="cpf" error={errors.cpf} />          // "CPF inválido"
<FormError message={errors._form} />              // "Erro ao salvar. Tente novamente." (falha de rede, 500, etc.)
```

- Erro de campo: mensagem específica da regra que falhou (`obrigatório`, `formato inválido`, `CPF inválido`), exibida perto do input, associada via `aria-describedby`/`aria-invalid`
- Erro geral (`_form`/`root`): reservado para falha que não pertence a um campo — erro de rede, 500 do server, conflito genérico
- Erro 422 do server com detalhe por campo (ver `input-validation`) deve ser mapeado de volta para os campos do form, não virar um único erro genérico

```
// ✅ Mapear erro de validação do server (formato { fields: [{ path, message }] }) de volta pros campos
response.error.fields.forEach(({ path, message }) => form.setFieldError(path, message))
```

## Checklist

- [ ] Schema de validação é a mesma definição usada por client e server (ou espelhada com teste de contrato)
- [ ] CPF/CNPJ validam dígito verificador, não só regex de formato
- [ ] Telefone/CEP validam formato e removem máscara antes de enviar ao server
- [ ] Erro de campo aparece perto do input, com mensagem específica da regra
- [ ] Erro geral do form (`_form`) só é usado para falha sem campo específico (rede, 500)
- [ ] Erro 422 do server (por campo) é remapeado para os campos do form, não vira mensagem genérica
- [ ] Botão de submit desabilita/mostra loading durante o envio (evita duplo submit)
- [ ] Campos obrigatórios marcados visualmente e no `required`/`aria-required`

## Exemplos por stack

**React Hook Form + Zod** (stack de referência)
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

## Anti-patterns

- ❌ Regra de validação escrita separadamente no client e no server (divergem com o tempo)
- ❌ Validar CPF/CNPJ só por regex de formato, sem checar dígito verificador
- ❌ Um único bloco de erro genérico no topo do form em vez de erro por campo
- ❌ Enviar valor com máscara (`123.456.789-00`) para o server em vez de só dígitos
- ❌ Reimplementar o cálculo de dígito verificador em cada formulário/projeto
- ❌ Ignorar o detalhe por campo que o server devolve e mostrar mensagem genérica de erro
- ❌ Permitir múltiplos submits enquanto a request está em voo
- ❌ Confiar que "o form validou" dispensa validação no server
