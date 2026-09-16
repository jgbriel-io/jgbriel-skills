---
name: seed-data
description: Explains reproducible seed data per environment — determinism, idempotency, dependency ordering, and masking real data for dev/test/staging. Database/ORM-agnostic. Use when user asks about seed data, fixtures, db seed, populate database, dados de teste, or mocking a dev/staging database.
---

# Seed Data — Reproduzível por Ambiente

Seed é dado inserido de propósito pra deixar um ambiente utilizável — diferente de migration (muda schema) e de dado de produção (real, do usuário). Vale pra qualquer banco/ORM: o problema é sempre o mesmo — gerar dado determinístico, idempotente e do tamanho certo pro ambiente.

## Seed x Migration x Fixture

| Conceito | O que é | Quando roda |
|---|---|---|
| Migration | Muda estrutura (schema) | Todo deploy, todo ambiente |
| Seed | Popula dado de referência/exemplo | Setup de ambiente (dev, CI, staging) |
| Fixture | Dado fixo pra um teste específico | Só durante a execução daquele teste |

```
// ❌ Seed misturado dentro de arquivo de migration
ALTER TABLE produtos ADD COLUMN categoria_id INT;
INSERT INTO produtos (nome, categoria_id) VALUES ('Exemplo', 1);

// ✅ Migration só muda estrutura; seed é script/comando separado, versionado à parte
```

## Determinismo

Seed que gera dado diferente a cada execução quebra teste, quebra comparação entre ambientes e impossibilita debug ("no meu deu esse bug, no seu não").

```ts
// ❌ Faker sem seed fixo — dado muda a cada rodada
const nome = faker.person.fullName();

// ✅ RNG com seed fixo — mesmo dado sempre, em qualquer máquina/CI
faker.seed(42);
const nome = faker.person.fullName();
```

- Nunca usar `now()`/`Date.now()`/`random()` direto no dado gerado — fixar timestamp de referência (`const AGORA = new Date('2024-01-01')`) e derivar datas a partir dele.
- IDs previsíveis quando possível (sequenciais ou UUID gerado com seed fixo), pra poder referenciar em teste (`WHERE id = 1`) sem precisar consultar antes.

## Idempotência

Rodar o seed duas vezes não pode duplicar linha nem quebrar por violação de unique/FK.

```sql
-- ❌ INSERT puro — segunda execução duplica ou falha em constraint única
INSERT INTO categorias (nome) VALUES ('Eletrônicos');

-- ✅ Upsert — idempotente em qualquer número de execuções
INSERT INTO categorias (id, nome) VALUES (1, 'Eletrônicos')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;
```

Alternativas equivalentes por ferramenta: `findOrCreate`/`upsert` no ORM, `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL), ou truncar as tabelas de seed antes de reinserir (só em ambiente não-produtivo, nunca em dado real).

## Ordem de dependências

Seed de tabela com FK precisa respeitar a ordem de inserção (pai antes de filho) e, ao limpar, a ordem inversa (filho antes de pai) — ou desabilitar checagem de FK temporariamente, se o banco suportar.

```
// ❌ Seed de pedidos antes de clientes existirem — FK falha
seedPedidos(); seedClientes();

// ✅ Respeita o grafo de dependência: referência antes de quem referencia
seedClientes(); seedProdutos(); seedPedidos();
```

Em bases maiores, extrair a ordem automaticamente a partir do schema (topological sort pelas FKs) evita manter a lista manualmente.

## Seed por ambiente

| Ambiente | Volume | Origem do dado | Objetivo |
|---|---|---|---|
| Dev local | Pequeno/médio, realista | 100% sintético (Faker/gerador) | Ambiente utilizável sem depender de ninguém |
| Teste/CI | Mínimo, só o necessário pro caso testado | 100% sintético, determinístico | Teste rápido e reprodutível |
| Staging/homologação | Próximo do volume real | Cópia de produção **mascarada**, ou sintético em escala | Validar comportamento com volume/distribuição real |
| Produção | — | Nunca seed automático | Seed é coisa de ambiente não-produtivo |

- Nunca rodar script de seed contra produção — se precisa popular dado de referência em produção (ex: tabela de status, categoria fixa), isso é migration de dado, não seed, e segue a mesma disciplina de `safe-migrations`.
- Dado sintético em dev deve parecer real o suficiente pra pegar bug de formatação/tamanho (nome longo, acento, CPF inválido de propósito), mas nunca ser dado de pessoa real.

## Mascaramento ao copiar produção

Quando staging precisa de volume/distribuição real, copia-se produção mas mascarando todo dado pessoal antes do dado chegar em qualquer ambiente não-produtivo — nome, e-mail, telefone, documento, endereço trocados por gerado consistente (mesmo `id` sempre vira o mesmo nome fake, pra manter joins e testes de regressão funcionando). Pseudonimização reversível (hash) não é suficiente — ver checklist de mascaramento e retenção em `lgpd-checklist`.

```
// ❌ Dump de produção restaurado direto em staging
pg_restore producao.dump

// ✅ Dump passa por pipeline de mascaramento antes de chegar em staging
pg_restore producao.dump | mask-pii --config=masking.yml
```

## Volume e performance

- Seed de dev: rápido (segundos), não minutos — se está lento, reduzir volume ou paralelizar inserts em lote (`COPY`/bulk insert em vez de um INSERT por linha).
- Seed de carga/performance é um script separado do seed de dev (objetivo diferente: milhões de linhas, não legibilidade).
- Seed de teste automatizado deve criar só o mínimo de dado que o caso de teste precisa — seed genérico e gigante torna teste lento e frágil (mudança no seed quebra teste que não tem nada a ver).

## Checklist

- [ ] Seed determinístico — mesma execução, mesmo dado, em qualquer máquina/CI (RNG e datas com seed/valor fixo)
- [ ] Idempotente — rodar N vezes não duplica nem quebra constraint
- [ ] Respeita ordem de dependência de FK (inserção e limpeza)
- [ ] Separado de arquivo de migration — script/comando próprio, versionado no repo
- [ ] Nenhum dado pessoal real em dev/teste/CI
- [ ] Cópia de produção para staging passa por mascaramento antes de qualquer acesso não-produtivo
- [ ] Seed de teste automatizado cria só o dado mínimo do caso, não o dataset completo de dev
- [ ] Sem script de seed com acesso habilitado contra produção

## Anti-patterns

- ❌ Seed com `faker`/`random` sem seed fixo — dado muda a cada execução, teste vira flaky
- ❌ `INSERT` puro sem upsert/checagem — segunda execução duplica linha ou quebra
- ❌ Seed misturado dentro de arquivo de migration versionado
- ❌ Restaurar dump de produção em dev/staging sem mascarar dado pessoal antes
- ❌ Pseudonimizar (hash reversível) e chamar de "mascarado" — continua sendo dado pessoal
- ❌ Um seed gigante único servindo dev, teste e staging ao mesmo tempo, com finalidades diferentes
- ❌ Script de seed com string de conexão/credencial de produção acessível
- ❌ Ordem de inserção manual sem considerar FK — quebra toda vez que uma tabela nova é adicionada

## Exemplos por stack

**Supabase (`supabase/seed.sql`)** — rodado automaticamente por `supabase db reset` em dev local:
```sql
insert into categorias (id, nome) values (1, 'Eletrônicos')
on conflict (id) do update set nome = excluded.nome;
```

**Prisma + Postgres (Node/TS)** — `prisma/seed.ts`, com Faker seedado:
```ts
import { faker } from '@faker-js/faker';
faker.seed(42);

async function main() {
  const categoria = await prisma.categoria.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: 'Eletrônicos' },
  });
  // ... resto do grafo de dependência, sempre upsert
}
```
Registrado em `package.json` (`"prisma": { "seed": "ts-node prisma/seed.ts" }`), rodado via `prisma db seed` — nunca dentro de uma migration gerada.

**Python (SQLAlchemy/Django) com Faker seedado**:
```python
from faker import Faker
fake = Faker()
Faker.seed(42)

def seed():
    categoria, _ = Categoria.objects.get_or_create(id=1, defaults={"nome": "Eletrônicos"})
    # get_or_create/update_or_create garante idempotência
```
Django expõe isso como `management command` (`python manage.py seed`); SQLAlchemy puro roda como script chamado a partir de um `Makefile`/task runner.
