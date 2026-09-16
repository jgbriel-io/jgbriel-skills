---
name: backup-restore
description: Explains backup strategy and restore testing for relational databases — full vs. incremental vs. PITR, RPO/RTO, retention, and the periodic restore drill that proves a backup is actually usable. Database/tool-agnostic. Use when user asks about backup, disaster recovery, RPO, RTO, PITR, restore, or snapshot.
---

# Backup & Restore

Backup que nunca foi restaurado não é backup — é uma aposta não testada. A pergunta que importa não é "temos backup?", é "quando testamos o restore pela última vez, e quanto tempo levou?". Vale para qualquer banco relacional e qualquer ferramenta (pg_dump, mysqldump, PITR nativo, snapshot gerenciado do Supabase/cloud).

## RPO e RTO — definir antes de escolher ferramenta

| Métrica | Pergunta | Define |
|---|---|---|
| RPO (Recovery Point Objective) | Quanto de dado posso perder? | Frequência de backup / uso de PITR |
| RTO (Recovery Time Objective) | Quanto tempo posso ficar fora do ar? | Estratégia de restore, tamanho do banco, automação |

Sem RPO/RTO definidos, "fazer backup" é uma tarefa sem critério de sucesso. Exemplo: RPO de 5 minutos exige PITR (replay de WAL/binlog) — backup noturno sozinho não atende. RTO de 15 minutos exige restore automatizado testado, não um runbook manual de 40 passos.

## Tipos de backup

| Tipo | O que é | Quando usar |
|---|---|---|
| Lógico (dump) | Exporta dados como SQL/formato portável (`pg_dump`, `mysqldump`) | Migração entre versões/motores, backups pequenos, portabilidade |
| Físico (snapshot) | Copia os arquivos de dados brutos do disco | Bancos grandes, restore rápido, mesma versão/motor |
| Completo | Cópia integral do banco num instante | Base de qualquer estratégia, mais caro em espaço/tempo |
| Incremental | Só o que mudou desde o último backup | Reduz janela e custo, mas encadeia dependência (perder um elo quebra a cadeia) |
| PITR (Point-in-Time Recovery) | Backup completo + log de transações (WAL/binlog) contínuo | Restaurar para qualquer segundo específico, não só o horário do backup |

Lógico é portável mas lento para restaurar em bancos grandes (recria índices, reprocessa constraints). Físico/snapshot restaura rápido mas geralmente exige mesma versão de motor e mesma arquitetura.

## Retenção e armazenamento

```
# ❌ backup na mesma instância/disco do banco de produção
/var/lib/postgresql/backups/dump.sql

# ✅ backup replicado para storage separado, fora do blast radius do banco original
# (outra região, outra conta/projeto, storage imutável quando disponível)
```

- Regra 3-2-1 como piso: 3 cópias, 2 mídias/storages diferentes, 1 fora do site/região.
- Retenção em camadas: diário (7–14 dias) + semanal (4–8 semanas) + mensal (6–12 meses), ajustado a exigência regulatória/contratual do cliente.
- Backup criptografado em repouso e em trânsito — mesmo nível de proteção que o banco original (backup é o mesmo dado, só em outro formato).
- Storage com política de retenção/imutabilidade (WORM, object lock) quando o risco inclui ransomware ou remoção maliciosa — backup mutável por quem tem acesso ao banco não protege contra esse cenário.
- Backup de banco multi-tenant carrega dado de todos os clientes — restrição de acesso ao backup precisa ser igual ou mais estrita que ao banco vivo (ver `multi-tenant-isolation-audit`).

## O teste de restore é o produto, não o backup

Um job de backup verde no painel de monitoramento prova que o *dump* foi gerado — não prova que ele restaura, não prova que os dados estão íntegros, e não prova que o RTO combinado é alcançável.

```
# ❌ "backup roda toda noite, nunca falhou" — sem nunca ter restaurado de fato
# ✅ restore de verdade, em ambiente isolado, com validação de conteúdo, em cadência fixa
```

Runbook mínimo do teste periódico:

1. Provisionar ambiente isolado (não é a mesma instância nem a mesma rede do banco de produção).
2. Restaurar o backup mais recente (ou um ponto aleatório dentro da janela de retenção, para não testar sempre o caminho mais fácil).
3. Rodar validação de conteúdo — contagem de linhas em tabelas-chave, checksum, uma query de negócio conhecida (ex: total de pedidos do mês bate com o valor esperado).
4. Medir o tempo total do processo (download + restore + validação) e comparar contra o RTO combinado.
5. Registrar resultado (sucesso/falha, tempo, versão restaurada) — histórico de testes é a evidência de que o backup é confiável, não a existência do arquivo.
6. Se falhar: tratar como incidente, não como "tentar de novo depois" — a causa (dump corrompido, credencial vencida, storage inacessível) provavelmente afeta o próximo backup também.

Cadência sugerida: trimestral no mínimo; mensal para dados críticos/regulados; sempre após mudança relevante de infraestrutura (troca de versão do motor, migração de storage, mudança de topologia de réplica).

## Sinais de que o backup não é confiável

| Sinal | Risco |
|---|---|
| Nunca foi restaurado, só gerado | Dump pode estar corrompido ou incompleto sem ninguém saber |
| Restore só testado em banco pequeno/vazio de dev | RTO real desconhecido — volume de produção muda tudo |
| Credencial/permissão de acesso ao storage de backup não testada há meses | Rotação de chave pode ter quebrado o job silenciosamente |
| Backup e banco de produção na mesma conta/região sem isolamento | Um incidente de conta comprometida ou desastre regional apaga os dois |
| Sem alerta de falha de job de backup | Job pode estar quebrado há semanas sem ninguém notar |
| PITR sem teste de replay do log até um ponto específico | "Backup completo existe" não é o mesmo que "sei restaurar até as 14h32 de terça" |

## Checklist

- [ ] RPO e RTO definidos e documentados por sistema/cliente (não um valor genérico para tudo)
- [ ] Backup automatizado, com alerta ativo em caso de falha do job
- [ ] Backup replicado para storage separado da instância de produção (3-2-1 como piso)
- [ ] Retenção em camadas configurada e alinhada a exigência contratual/regulatória (ver `lgpd-checklist`)
- [ ] Backup criptografado em repouso e em trânsito
- [ ] Restore testado em ambiente isolado em cadência fixa, com validação de conteúdo (não só "o comando rodou sem erro")
- [ ] Tempo de restore medido e comparado contra o RTO combinado
- [ ] Resultado de cada teste de restore registrado (data, sucesso/falha, tempo)
- [ ] Acesso ao backup restrito com o mesmo rigor que o acesso ao banco vivo (crítico em multi-tenant)
- [ ] PITR (quando usado) testado com replay até um ponto específico, não só existência do log

## Exemplos por stack

**Supabase** — backup automático diário incluído no plano; PITR disponível no plano Pro+. Teste de restore ainda é manual: restaurar num projeto Supabase novo e isolado, rodar a validação de conteúdo, medir o tempo — o Supabase gerenciar o backup não elimina a necessidade de testar o restore.

**PostgreSQL (self-managed)** — lógico com `pg_dump -Fc` (formato custom, restaura com `pg_restore`, permite restore paralelo e seletivo por tabela); PITR com `pg_basebackup` + arquivamento contínuo de WAL (`archive_command`), restaurado com `restore_command` + `recovery_target_time`.

**RDS / Cloud SQL (snapshot gerenciado)** — backup automático + PITR nativo da plataforma; o teste de restore ainda é manual: restaurar o snapshot/PITR para um projeto/instância novo e isolado, rodar a validação de conteúdo, medir o tempo.

**MySQL/MariaDB** — lógico com `mysqldump --single-transaction` (evita lock em InnoDB); PITR combinando snapshot completo + replay de binlog (`mysqlbinlog --start-datetime`) até o ponto desejado.

## Anti-patterns

- ❌ Confiar em "o job de backup nunca falhou" sem nunca ter restaurado de fato
- ❌ Testar restore só em banco vazio/pequeno de dev, nunca com volume real de produção
- ❌ Backup na mesma conta/região/instância do banco original, sem cópia isolada
- ❌ Sem alerta configurado para falha silenciosa do job de backup
- ❌ Retenção genérica (ex: só 7 dias) sem checar exigência contratual/regulatória do cliente
- ❌ Backup não criptografado, ou com controle de acesso mais frouxo que o banco vivo
- ❌ RPO/RTO nunca discutidos com o cliente — descobertos na hora do incidente
- ❌ PITR configurado mas nunca testado o replay até um ponto específico no tempo
- ❌ Backup de banco multi-tenant acessível por quem não teria acesso a todos os tenants no banco vivo
