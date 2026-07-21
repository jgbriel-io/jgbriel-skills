---
name: query-performance
description: Diagnoses slow SQL queries by reading execution plans and picking the right index strategy — composite, partial, covering. Use when user asks about slow queries, query optimization, EXPLAIN/execution plans, missing indexes, N+1 queries, or database performance tuning.
---

# Query Performance — Diagnóstico e Índices

Vale para qualquer SGBD relacional (Postgres, MySQL, SQL Server, Oracle). Os nomes dos operadores mudam, o raciocínio não.

## Fluxo de diagnóstico

1. Identificar a query lenta (log de slow query, APM, Query Store) — nunca otimizar às cegas
2. Rodar o plano de execução **com dados reais**, não só estimado
3. Procurar scan completo (full/sequential scan) em tabela grande
4. Comparar linhas estimadas vs linhas reais — divergência grande = estatísticas desatualizadas
5. Olhar o algoritmo de join e as operações de sort — costumam ser o custo real, não o scan
6. Criar/ajustar índice, rodar o plano de novo, comparar custo antes/depois
7. Medir impacto em escrita (todo índice novo tem custo em INSERT/UPDATE/DELETE)

## Como ler um plano de execução

Todo plano de execução tem os mesmos elementos, independente do motor:

- **Custo** (startup..total ou estimated subtree cost) — número relativo, não tempo absoluto
- **Linhas estimadas vs reais** — se o otimizador erra a estimativa, o plano inteiro pode estar errado
- **Tipo de acesso à tabela**:
  - full/sequential scan (ou table scan) — lê a tabela inteira
  - index scan / index seek — usa índice pra localizar linhas
  - index-only scan / covering — resolve a query só com o índice, sem tocar a tabela
- **Estratégia de join**:
  - nested loop — bom quando um dos lados é pequeno
  - hash join — bom para datasets grandes sem ordenação
  - merge join — bom quando as entradas já vêm ordenadas (por índice)
- **Operações de sort/agregação** — costumam custar mais que o scan em si; se aparecem em toda query repetida, considerar índice já ordenado

```sql
-- ❌ Olhar só o plano estimado
EXPLAIN SELECT * FROM pedidos WHERE cliente_id = 123;

-- ✅ Rodar com execução real (linhas reais, tempo real, buffers)
EXPLAIN ANALYZE SELECT * FROM pedidos WHERE cliente_id = 123;
```

## Índices — qual tipo usar

| Situação | Tipo de índice |
|---|---|
| Coluna usada em `WHERE`/`JOIN` isolada | Índice simples |
| Duas ou mais colunas sempre filtradas juntas | Índice composto (ordem: igualdade antes de range) |
| Filtro recorrente por um subconjunto (`status = 'ativo'`, `deleted_at IS NULL`) | Índice parcial |
| Query só lê colunas que cabem no índice | Índice covering (evita lookup na tabela) |
| Filtro por função/expressão (`LOWER(email)`, `date_trunc('day', ...)`) | Índice de expressão |

```sql
-- Índice composto: coluna de igualdade primeiro, range depois
CREATE INDEX idx_pedidos_cliente_data ON pedidos (cliente_id, criado_em);

-- Índice parcial: menor, mais rápido, só serve se a query usa o mesmo filtro
CREATE INDEX idx_pedidos_ativos ON pedidos (cliente_id) WHERE status = 'ativo';

-- Índice de expressão: sem ele, WHERE LOWER(email) = ... força scan completo
CREATE INDEX idx_usuarios_email_lower ON usuarios (LOWER(email));
```

A ordem das colunas em um índice composto importa: o motor só usa o índice de forma eficiente da esquerda pra direita. `(cliente_id, criado_em)` resolve `WHERE cliente_id = ?` e `WHERE cliente_id = ? AND criado_em > ?`, mas não resolve bem `WHERE criado_em > ?` sozinho.

## O que impede o uso de um índice

```sql
-- ❌ Função sobre a coluna indexada anula o índice
WHERE LOWER(email) = 'a@b.com'  -- sem índice de expressão, vira full scan

-- ❌ Wildcard no início do LIKE não usa índice B-tree
WHERE nome LIKE '%silva'

-- ❌ Cast implícito de tipo (coluna INT comparada com string)
WHERE codigo = '123'  -- se codigo é INT, pode invalidar o índice

-- ❌ OR entre colunas sem índice combinado ou sem UNION
WHERE cliente_id = 1 OR vendedor_id = 1
```

## Outras causas de lentidão (não são sobre índice)

- N+1: uma query por item de uma lista em vez de um único `JOIN`/`IN`
- `SELECT *` quando só algumas colunas são usadas — mais I/O, impede index-only scan
- Paginação sem limite, ou com `OFFSET` grande (motor ainda percorre e descarta as linhas puladas)
- Estatísticas desatualizadas — o otimizador decide o plano com base em estimativas de cardinalidade; sem `ANALYZE`/atualização de estatísticas, ele erra o plano mesmo com índice certo

## Checklist

- [ ] Plano coletado com execução real (dados reais, não só estimativa)
- [ ] Scan completo em tabela grande identificado e justificado (ou removido)
- [ ] Linhas estimadas próximas das reais (senão, atualizar estatísticas)
- [ ] Índice testado reduz custo do plano de forma mensurável
- [ ] Índice novo não duplica um já existente (mesma coluna líder)
- [ ] Impacto em escrita avaliado (tabela com muitos INSERTs não recebe índice a esmo)
- [ ] Paginação sem `OFFSET` alto (cursor/keyset quando o volume é grande)

## Exemplos por stack

**Postgres** (incluindo Supabase) — `EXPLAIN (ANALYZE, BUFFERS)` mostra custo, linhas reais e I/O de buffer; índice parcial e `CREATE INDEX CONCURRENTLY` evitam lock em produção:
```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM pedidos WHERE cliente_id = 123;
CREATE INDEX CONCURRENTLY idx_pedidos_cliente ON pedidos (cliente_id);
```

**MySQL** — `EXPLAIN ANALYZE` (8.0+) mostra o plano real de execução; índice composto segue a mesma regra de ordem de colunas, sem suporte nativo a índice parcial:
```sql
EXPLAIN ANALYZE SELECT * FROM pedidos WHERE cliente_id = 123 AND status = 'ativo';
CREATE INDEX idx_pedidos_cliente_status ON pedidos (cliente_id, status);
```

**SQL Server** — plano de execução real via `SET STATISTICS IO, TIME ON` ou "Include Actual Execution Plan"; índice covering usa `INCLUDE` pra guardar colunas extras sem entrar na chave:
```sql
SET STATISTICS IO ON;
SELECT id, nome FROM pedidos WHERE cliente_id = 123;

CREATE INDEX idx_pedidos_cliente ON pedidos (cliente_id) INCLUDE (nome, status);
```

## Anti-patterns

- ❌ Criar índice sem comparar o plano antes/depois
- ❌ Índice composto com a coluna errada na frente (não bate com o filtro mais comum)
- ❌ Índice em toda coluna "pra garantir" — cada índice tem custo de escrita e espaço
- ❌ Confiar em plano estimado sem rodar com execução real
- ❌ Resolver lentidão de query com cache na aplicação sem investigar a causa no banco
- ❌ Ignorar `OFFSET` alto em paginação de tabela grande
- ❌ Deixar estatísticas desatualizadas depois de uma carga grande de dados
