---
name: safe-migrations
description: Explains zero-downtime schema migrations for relational databases — expand-contract pattern, batch data backfills, lock avoidance, safe column add/rename/drop/type-change. Use when user asks about migrations, ALTER TABLE, schema changes, downtime, locks, backfill, or rollback strategy.
---

# Migrations Seguras — Zero Downtime

Em deploy rolling, código antigo e código novo rodam ao mesmo tempo contra o mesmo schema. Uma migration que só funciona com uma versão do código quebra a outra. Vale para qualquer banco relacional e qualquer ferramenta (Supabase CLI, Flyway, Liquibase, Prisma, Alembic, ActiveRecord, goose, EF Core).

## Expand-Contract (Parallel Change)

Toda migration destrutiva (rename, drop, mudança de tipo, `NOT NULL` novo) quebra em 3 deploys, nunca 1:

1. **Expand** — adiciona o novo, sem tocar no antigo. Código velho e novo convivem.
2. **Migrate** — backfill de dados + deploy do código novo lendo/escrevendo na coluna nova (dual-write se necessário).
3. **Contract** — remove o antigo, só depois que 100% do tráfego usa o novo.

```sql
-- ❌ Um deploy só: renomeia coluna em uso — quebra o código antigo em produção
ALTER TABLE pedidos RENAME COLUMN valor TO valor_total;

-- ✅ Deploy 1 (expand): coluna nova, nullable
ALTER TABLE pedidos ADD COLUMN valor_total NUMERIC(10,2);

-- ✅ Deploy 2 (migrate): backfill em lote (ver seção abaixo) +
-- código novo passa a escrever nas duas colunas (dual-write)
UPDATE pedidos SET valor_total = valor WHERE valor_total IS NULL;

-- ✅ Deploy 3 (contract): só depois que todo código lê/escreve valor_total
ALTER TABLE pedidos DROP COLUMN valor;
```

## Regras por tipo de mudança

| Mudança | Risco | Estratégia |
|---|---|---|
| Add coluna nullable | Baixo | Direto, 1 deploy |
| Add coluna `NOT NULL` | Alto — lock + falha em linhas existentes | Nullable → backfill → constraint `NOT VALID` → `VALIDATE CONSTRAINT` separado |
| Rename coluna/tabela | Alto — quebra código antigo | Expand-contract completo |
| Drop coluna | Médio — código antigo pode ler/escrever nela | Remover uso no código → deploy → esperar → só então dropar |
| Mudar tipo | Alto — rewrite de tabela + lock | Coluna nova do tipo certo + backfill + swap |
| Add índice | Médio — lock de escrita na tabela inteira | Variante concorrente/online (nunca `CREATE INDEX` simples em tabela grande) |
| Add FK/CHECK | Médio — lock durante validação do dado existente | `NOT VALID` na criação + `VALIDATE CONSTRAINT` em passo separado |

## Locks

- `ALTER TABLE` sem `NOT VALID` pode travar leitura/escrita durante toda a operação (o nome do lock muda por banco, mas o efeito — tabela inteira bloqueada — existe em todo relacional).
- Criar índice do jeito ingênuo bloqueia escrita na tabela inteira; usar a variante que não bloqueia (`CONCURRENTLY` no Postgres/Supabase, `pt-online-schema-change`/`gh-ost` ou `ALGORITHM=INPLACE` no MySQL).
- Configurar timeout de lock e de statement na migration, para falhar rápido em vez de travar a aplicação esperando:

```sql
SET lock_timeout = '2s';
SET statement_timeout = '30s';
```

- Nunca rodar a migration de schema dentro da mesma transação que faz backfill de milhões de linhas — a transação fica aberta, prende locks e cresce o log de transações (WAL/undo/binlog).

## Migração de dados em lote (backfill)

```sql
-- ❌ Um UPDATE gigante — trava a tabela inteira, transação longa, log explode
UPDATE pedidos SET valor_total = valor;

-- ✅ Em lotes pequenos, cada um em sua própria transação, com pausa entre eles
DO $$
DECLARE
  linhas_afetadas INT;
BEGIN
  LOOP
    UPDATE pedidos SET valor_total = valor
    WHERE id IN (SELECT id FROM pedidos WHERE valor_total IS NULL LIMIT 1000);
    GET DIAGNOSTICS linhas_afetadas = ROW_COUNT;
    EXIT WHEN linhas_afetadas = 0;
    PERFORM pg_sleep(0.1); -- alivia carga, deixa outras queries passarem
  END LOOP;
END $$;
```

Regras:

- Lotes pequenos (500–5000 linhas), nunca a tabela inteira numa transação só.
- Idempotente — reexecutar o job não pode duplicar/corromper (filtrar por `WHERE coluna IS NULL`, não por contador externo).
- Fora do horário de pico quando a tabela é grande (dezenas de milhões de linhas).
- Job de backfill roda fora da migration versionada — script separado, com checkpoint pra retomar se cair no meio.
- Monitorar lag de réplica/CDC durante o backfill, se existir.

## Reversibilidade

- Toda migration tem `up` e `down` — mesmo que `down` seja só "documentado, não totalmente executável" (dado apagado por `DROP COLUMN` não volta).
- Rollback de código é rápido (revert de deploy); rollback de schema é lento e arriscado — por isso expand-contract existe: o schema nunca precisa ser revertido no meio de um deploy.
- Backup/snapshot antes de qualquer `DROP COLUMN`/`DROP TABLE` em produção.

## Checklist

- [ ] Migration destrutiva quebrada em expand → migrate → contract, nunca 1 deploy só
- [ ] `NOT NULL` novo aplicado via `NOT VALID` + `VALIDATE CONSTRAINT` em passo separado
- [ ] Índice novo criado com variante concorrente/online
- [ ] Backfill em lotes, fora da transação da migration, idempotente
- [ ] `lock_timeout`/`statement_timeout` configurados na migration
- [ ] Testado contra um dump/cópia de produção (volume real), não só banco vazio de dev
- [ ] Código velho e código novo validados rodando simultaneamente contra o schema pós-migration
- [ ] Backup feito antes de operação destrutiva

## Anti-patterns

- ❌ Rename/drop de coluna em uso no mesmo deploy que remove o uso no código
- ❌ `ALTER TABLE ... ADD COLUMN ... NOT NULL` direto em tabela com dados existentes
- ❌ `CREATE INDEX` sem variante concorrente em tabela grande de produção
- ❌ Backfill de milhões de linhas em uma única transação/UPDATE
- ❌ Migration sem `down`/estratégia de rollback documentada
- ❌ Rodar migration manualmente em produção fora do pipeline versionado
- ❌ Migration testada só em banco vazio de dev, nunca com volume real de produção

## Exemplos por stack

**Supabase CLI** — `supabase migration new add_valor_total`, editar o SQL gerado seguindo expand-contract; backfill roda como script separado, nunca dentro da migration versionada.

**Prisma (Node/TS)** — gerar o SQL e editar antes de aplicar (`prisma migrate dev --create-only`):
```prisma
model Pedido {
  valor      Decimal
  valorTotal Decimal? @map("valor_total") // expand: nullable
}
```
Backfill roda como script separado (`ts-node scripts/backfill.ts`), nunca dentro do arquivo de migration gerado.

**Alembic (Python/SQLAlchemy)**:
```python
def upgrade():
    op.add_column('pedidos', sa.Column('valor_total', sa.Numeric(10, 2), nullable=True))
    # backfill aqui só se a tabela for pequena; senão, job separado em lotes

def downgrade():
    op.drop_column('pedidos', 'valor_total')
```

**Flyway/Liquibase (Java) e Rails ActiveRecord** seguem o mesmo padrão de uma migration versionada por fase — `V2__add_valor_total.sql` → `V3__backfill_valor_total.sql` → `V4__drop_valor.sql` no Flyway; `AddValorTotalToPedidos` → job de backfill → `RemoveValorFromPedidos` no Rails — nunca uma migration só fazendo tudo de uma vez.
