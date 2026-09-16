---
name: environment-config
description: Environment-based configuration conventions — .env.example, startup-time env validation (fail fast, not mid-request), and dev/staging/prod parity, applicable to any language or framework. Use when user asks about env vars, .env files, config setup, or "works on my machine" environment drift. Vault/rotation is secrets-management, not this skill.
---

# Environment Config

Convenção de configuração por ambiente. Vale para Node, Python, Java, Go, Ruby, .NET — qualquer stack que leia config do ambiente.

## `.env.example`

Todo repo tem um `.env.example` versionado, espelhando 1:1 as chaves que o app lê — sem valores reais.

```bash
# .env.example — versionado no git
DATABASE_URL=postgres://user:password@localhost:5432/app_dev
API_PORT=3000
JWT_SECRET=changeme
EXTERNAL_API_KEY=
LOG_LEVEL=info
```

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

Regras:

- `.env.example` documenta a **forma** (nome da chave, formato, exemplo inofensivo) — nunca o valor real
- `.env` real nunca é commitado, nunca aparece em PR, nunca vai em screenshot de log
- Toda chave nova em uso no código entra no `.env.example` no mesmo commit — se não está lá, não existe pro próximo dev (ou pra você daqui a 6 meses)
- Nome de variável descreve o dado, não o ambiente: `DATABASE_URL`, não `PROD_DATABASE_URL` (o ambiente já é dado pelo `.env` carregado, não pelo nome da chave)

## Validação na inicialização

Config inválida ou faltando é erro de **startup**, não de request. O processo não deve subir — e muito menos aceitar tráfego — com config incompleta.

```
❌ errado: app sobe, request 3847 chama a API externa,
   EXTERNAL_API_KEY é undefined, cliente recebe 500 misterioso

✅ certo: app tenta subir, valida env, imprime
   "EXTERNAL_API_KEY é obrigatório e não foi definido", processo sai com código != 0
```

Padrão: definir um schema de config e validar contra ele antes de qualquer outra coisa rodar (antes de abrir porta, antes de conectar ao banco, antes de registrar rotas).

```ts
// exemplo conceitual, independente de lib
const schema = {
  DATABASE_URL: { type: 'string', required: true },
  API_PORT: { type: 'number', default: 3000 },
  JWT_SECRET: { type: 'string', required: true, minLength: 16 },
  LOG_LEVEL: { type: 'enum', values: ['debug', 'info', 'warn', 'error'], default: 'info' },
};

const config = validate(process.env, schema); // lança e mata o processo se inválido
```

Checklist do validador:

- [ ] Falha o processo (exit != 0) se variável obrigatória está ausente ou vazia
- [ ] Valida tipo/formato, não só presença (`API_PORT` precisa ser número, `DATABASE_URL` precisa parsear como URL)
- [ ] Mensagem de erro nomeia a chave que falta — nunca um stack trace genérico
- [ ] Validação roda uma vez, no boot, antes do app aceitar conexões — não em cada request
- [ ] Um único módulo/arquivo de config é o dono do parse — resto do código importa o config já validado, nunca lê `process.env` (ou equivalente) direto

## Paridade dev/staging/prod

Mesmo shape de config em todo ambiente — o que muda é o **valor**, nunca a **chave** nem a lógica que a lê.

| | Dev | Staging | Prod |
|---|---|---|---|
| Chaves exigidas | mesmas | mesmas | mesmas |
| `DATABASE_URL` | banco local/docker/Supabase local | banco de staging | banco de prod |
| Comportamento no código | idêntico | idêntico | idêntico |
| Fonte do valor | `.env` local | secret manager / CI | secret manager / CI |

- Nunca existe `if (env === 'dev') { pularValidacao() }` — se a config é obrigatória em prod, é obrigatória em dev também (só que com valor de dev)
- Nunca existe branch de lógica de negócio baseada em nome de ambiente (`if (env === 'staging')`) — comportamento é controlado por feature flag, não por ambiente
- Diferença de infraestrutura (URL de banco, chave de API) fica na config; diferença de comportamento nunca deveria depender do ambiente
- Ambiente que só existe pra rodar teste manual antes de subir pra prod deve usar o mesmo mecanismo de config que prod — senão o teste não vale nada

## Fronteira com secrets-management

Esta skill cobre **convenção**: onde a chave mora, como ela é nomeada, como o app valida que ela existe. Não cobre:

- Rotação de credenciais
- Cofre/vault (Vault, AWS Secrets Manager, Doppler, etc.)
- Quem tem acesso a qual segredo

Isso é `secrets-management`. Se a pergunta é "como faço rotation de `JWT_SECRET`" ou "onde guardar credencial de produção com segurança", a resposta está lá — aqui é só "a chave existe, está documentada, e o app falha rápido se ela faltar".

## Multi-cliente (freela)

Em trabalho com múltiplos clientes, cada projeto/cliente tem seu próprio conjunto de valores (não de chaves) — mesmo `.env.example`, `.env` diferente por cliente/ambiente. Nunca hardcode um valor específico de cliente no código; se um cliente precisa de comportamento diferente, isso é uma chave de config nova (ou feature flag), não um `if (cliente === 'x')`.

## Exemplos por stack

**Vite/React** (validação com Zod, no boot da app):
```ts
import { z } from 'zod';
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});
export const config = envSchema.parse(import.meta.env); // lança se inválido
```

**Node.js/NestJS** (validação com Zod):
```ts
import { z } from 'zod';
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16),
});
export const config = envSchema.parse(process.env); // lança e mata o boot se inválido
```

**Python** (Pydantic Settings):
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_port: int = 3000
    jwt_secret: str

    class Config:
        env_file = ".env"

settings = Settings()  # ValidationError derruba o processo no import
```

**Go** (validação manual no `main`, antes de `http.ListenAndServe`):
```go
func loadConfig() Config {
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL é obrigatório e não foi definido")
    }
    return Config{DatabaseURL: dbURL}
}
```

## Anti-patterns

- ❌ `.env` real commitado no git (ou em `.env.example` com valor real por engano)
- ❌ Ler `process.env`/`import.meta.env` (ou equivalente) espalhado pelo código em vez de um módulo de config centralizado
- ❌ Config faltando só é descoberta quando o request que usa aquela chave é disparado em produção
- ❌ Variável de ambiente sem validação de tipo (`API_PORT` é string `"abc"` e só quebra no `parseInt` lá na frente)
- ❌ Lógica de negócio ramificada por nome de ambiente (`if (env === 'staging')`)
- ❌ Chave de config nomeada com o ambiente embutido (`PROD_DATABASE_URL`)
- ❌ Valor de cliente específico hardcoded no código em vez de vir de config
- ❌ Ambiente de teste manual pulando validação que existe em prod
