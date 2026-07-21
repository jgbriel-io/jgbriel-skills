---
name: multi-tenant-isolation-audit
description: Audits multi-tenant systems for cross-tenant data leakage — missing isolation filters, privileged-role bypass (service_role/admin), untested boundaries. Mechanism-agnostic (RLS, ORM tenant_id, schema-per-tenant). Use when user asks about tenant isolation, multi-tenancy security, data leakage between clients/orgs, or auditing access control across accounts.
---

# Multi-Tenant Isolation Audit

Auditoria de isolamento entre tenants (clientes, organizações, contas) num sistema multi-tenant. Não ensina a implementar o mecanismo de isolamento — isso é responsabilidade das skills de banco/framework (ex: `supabase-postgres`/`postgres-conventions` pra RLS). Aqui o objetivo é auditar: existe isolamento? está correto? tem furo?

## O que é isolamento multi-tenant

Todo recurso (linha, arquivo, mensagem, job) pertence a exatamente um tenant. Toda operação de leitura/escrita precisa estar restrita ao tenant do usuário autenticado — nunca ao tenant que o client alega ser.

```
// ❌ tenant vem do payload/client
GET /invoices?companyId=123

// ✅ tenant vem da sessão/token, nunca do input
GET /invoices  →  companyId = session.tenantId
```

## Mecanismos de isolamento (qualquer um destes é válido)

| Mecanismo | Onde vive a garantia | Risco típico |
|---|---|---|
| RLS / row-security no banco | Banco de dados | Bypass via role privilegiada (service_role, superuser) |
| Filtro `tenant_id` em toda query (ORM/repository) | Camada de aplicação | Um dev esquece o filtro numa query nova |
| Schema-per-tenant | Conexão/schema search_path | Migration ou job roda no schema errado |
| Database-per-tenant | Connection string | Connection pool compartilhado entre tenants por engano |

Nenhum mecanismo é seguro por padrão — todos dependem de disciplina em algum ponto do sistema. A auditoria é achar esse ponto.

## Onde o isolamento vaza (superfície de auditoria)

- **Queries diretas**: endpoint novo que esqueceu o filtro/policy
- **Joins e agregações**: join entre tabela com tenant_id e tabela sem, ou view/relatório que soma dados de todos os tenants
- **Bypass por papel privilegiado**: conexão admin/service-role/superuser que pula RLS ou roda com filtro desabilitado — usada em jobs, seeds, migrations, scripts internos
- **Background jobs / filas / cron**: processam lote sem contexto de tenant, ou herdam contexto do último request processado
- **Cache e índice de busca**: chave de cache/search sem tenant_id — resultado de um tenant aparece pra outro
- **Storage de arquivos**: path previsível (`/uploads/{fileId}`) sem checar dono, permitindo acesso cross-tenant por enumeração de ID
- **Webhooks e integrações externas**: payload de retorno não valida a qual tenant pertence antes de gravar
- **Exports e relatórios**: função de export que roda com privilégio elevado "pra performance" e ignora o filtro padrão
- **Logs e mensagens de erro**: erro vaza dado de outro tenant (ex: "email já cadastrado" revela existência de registro)
- **Impersonation / suporte**: modo "logar como cliente X" sem registro de auditoria e sem escopo revogado ao sair

## Testando isolamento

Todo recurso multi-tenant precisa de teste automatizado que tenta o acesso cross-tenant e espera falha — não só o caminho feliz.

```
Padrão do teste de isolamento, qualquer stack:
1. cria tenant A e tenant B
2. cria recurso R como tenant A
3. autentica como tenant B
4. tenta ler/atualizar/deletar R
5. assert: 403/404/vazio — nunca 200 com dado de A
```

Rodar essa matriz pra cada endpoint/tabela nova é o teste de regressão mais barato contra vazamento entre clientes. Ver skill `integration-testing` para como versionar isso como suíte automatizada.

## Checklist

- [ ] Toda tabela/coleção nova tem mecanismo de isolamento aplicado (RLS habilitada, filtro tenant_id no repository, ou schema correto) — não só as "sensíveis"
- [ ] Tenant/company/org id vem do token de sessão autenticado, nunca de query param, body ou header controlado pelo client
- [ ] Toda conexão/role privilegiada (service_role, superuser, admin API key) tem uso mapeado e justificado — se pula o isolamento, tem outro controle equivalente no código que a usa
- [ ] Jobs assíncronos, filas e cron carregam o tenant_id explicitamente no payload da mensagem — nunca inferido de contexto global/thread-local que pode vazar entre execuções
- [ ] Joins/agregações/relatórios cross-tabela não misturam dados de tenants diferentes
- [ ] Cache keys e índices de busca incluem tenant_id
- [ ] Paths de storage/arquivo não são adivinháveis por ID sequencial sem checagem de dono
- [ ] Webhooks validam a qual tenant o evento pertence antes de persistir
- [ ] Mensagens de erro não revelam existência/detalhe de dado de outro tenant
- [ ] Existe teste automatizado de isolamento (tenant A não acessa recurso de tenant B) para cada endpoint/tabela crítica
- [ ] Modo impersonation/suporte (se existir) é auditado e com escopo revogado ao sair
- [ ] Migrations e seeds rodam respeitando o mesmo mecanismo de isolamento, sem bypass "porque é script"

## Anti-patterns

- ❌ Confiar em filtro client-side (`.eq('tenant_id', ...)` montado no frontend) como única garantia — sem policy/checagem server-side isso é cosmético
- ❌ Usar conexão privilegiada (service_role/admin) no caminho comum "porque é mais simples" em vez de reservá-la pra casos excepcionais e auditados
- ❌ `tenant_id` aceito como parâmetro do client em vez de derivado da sessão
- ❌ Job/worker que herda tenant de uma variável global/thread-local reaproveitada entre execuções
- ❌ Teste de isolamento ausente — só existe teste de caminho feliz por tenant
- ❌ Tabela nova "temporária" ou "interna" sem isolamento porque "não é dado de cliente ainda"
- ❌ Export/relatório com query separada que ignora o mesmo filtro usado no resto do sistema
- ❌ Mensagem de erro que diferencia "não existe" de "existe mas não é seu" (vaza existência cross-tenant)

## Exemplos por stack

**Supabase/Postgres + RLS:**
```sql
-- Teste de isolamento direto no banco, como role da aplicação (não superuser)
set role app_user;
set app.current_user_id = '<user-id-tenant-b>';
select * from invoices where id = '<invoice-id-tenant-a>';
-- Esperado: 0 linhas (RLS bloqueou), nunca a linha do tenant A
```

**NestJS/TypeORM (tenant_id explícito em todo repository):**
```ts
// ❌ tenant_id vem do controller
findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }); }

// ✅ tenant_id sempre extraído do request autenticado, nunca de parâmetro do caller
@Injectable()
export class InvoicesService {
  findAll(@CurrentTenant() tenantId: string) {
    return this.repo.find({ where: { tenantId } });
  }
}
```

**Django (filtro central via manager, não por view):**
```python
# Middleware injeta o tenant atual; o manager aplica o filtro por padrão
class TenantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(tenant_id=get_current_tenant())
# Toda model multi-tenant usa esse manager — o filtro não fica a critério
# de cada view lembrar de aplicar.
```
