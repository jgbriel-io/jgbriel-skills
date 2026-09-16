---
name: postgres-conventions
description: Apply Postgres best practices — schema design, indexes, RLS policies, SQL queries, connection pooling. Use when user asks about Postgres schema, indexes, RLS policies, connection pooling, or SQL conventions on a plain Postgres backend (not Supabase). For Supabase use the supabase-postgres skill instead. Migrations are covered by the safe-migrations skill; slow-query diagnosis by query-performance.
---

# Postgres — Boas Práticas

> Migrations têm skill dedicada (`safe-migrations`); diagnóstico de query lenta também (`query-performance`).

## Queries

```sql
-- ❌
SELECT * FROM users;

-- ✅ Selecionar apenas colunas necessárias
SELECT id, name, email, status FROM users;
```

Paginação: `ORDER BY created_at DESC LIMIT :size OFFSET :page * :size` —
para listas muito grandes, preferir keyset pagination (`WHERE created_at < :cursor`).

Operações transacionais multi-tabela: função no banco ou transação explícita
na aplicação (`BEGIN ... COMMIT`) — nunca sequência de statements soltos.

## Índices

```sql
-- FKs usadas em WHERE/JOIN
CREATE INDEX idx_tabela_coluna ON tabela(coluna);

-- ORDER BY frequente
CREATE INDEX idx_tabela_created_at ON tabela(created_at DESC);

-- Filtros combinados
CREATE INDEX idx_tabela_owner_status ON tabela(owner_id, status);
```

## RLS

Row Level Security é feature nativa do Postgres — usar para tenant isolation
no nível do banco, mesmo fora do Supabase.

```sql
-- Sempre habilitar em novas tabelas
ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- Policy de owner (tenant isolation) — o app seta o contexto por transação:
-- SET LOCAL app.current_user_id = '<uuid>';
CREATE POLICY "owner_own_data" ON nova_tabela
  FOR ALL TO app_user
  USING (owner_id = current_setting('app.current_user_id')::uuid);

-- Policy de admin
CREATE POLICY "admin_all" ON nova_tabela
  FOR ALL TO app_user
  USING ((SELECT is_admin()));
```

**CRÍTICO:** Funções helpers como `is_admin()` DEVEM ter `SECURITY DEFINER` — sem isso causam recursão infinita em policies.

## Schema Design

- PKs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Timestamps: `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Soft delete: `deleted_at TIMESTAMPTZ`
- Status: `TEXT CHECK (status IN ('ativo', 'inativo'))`
- Valores monetários: `NUMERIC(10,2)` não `FLOAT`

## Funções

```sql
CREATE OR REPLACE FUNCTION minha_funcao()
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- lógica
END;
$$;
```

Sempre `SET search_path` — sem isso é vulnerável a injection de schema.

## Connection pooling

- Aplicação nunca abre uma conexão por request — usar pool do driver/ORM
  com limite explícito (`max`), dimensionado pelo `max_connections` do servidor
- Muitas instâncias/serverless: pooler externo (ex: PgBouncer em modo
  `transaction`) na frente do Postgres
- Em modo `transaction` do PgBouncer, evitar estado de sessão (`SET` sem
  `LOCAL`, prepared statements nomeados, advisory locks de sessão)
- Fechar/devolver conexão sempre — vazamento de conexão derruba o banco antes da CPU

## Anti-patterns

- ❌ `SELECT *` em tabelas grandes
- ❌ N+1 queries
- ❌ Funções sem `SET search_path`
- ❌ Tabelas sem RLS
- ❌ PKs sequenciais (INTEGER/SERIAL)
- ❌ Cálculos no frontend que poderiam ser views/funções no banco
- ❌ Policies com funções recursivas sem `SECURITY DEFINER`
- ❌ Conexão por request sem pool
