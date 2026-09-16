---
name: auth-patterns
description: Authentication and authorization patterns — OTP/password/OAuth/OIDC flows, session vs JWT, RBAC/ABAC, MFA, token refresh/revocation — provider-agnostic (Auth0, Cognito, Keycloak, Supabase Auth, custom). Use when user asks about login flows, access tokens, permissions, roles, or "who can do what".
---

# Auth Patterns — Autenticação & Autorização

Autenticação (quem é o usuário) e autorização (o que ele pode fazer) são camadas distintas — não misturar. Conceitos aqui valem para qualquer provedor ou stack; exemplos de código no final.

## Autenticação: escolha de fluxo

| Fluxo | Quando usar | Cuidado principal |
|---|---|---|
| Senha + hash | Padrão, controle total | Nunca armazenar em texto puro; usar bcrypt/argon2 |
| Magic link / OTP | Reduz fricção, sem senha pra vazar | Expiração curta (5-15 min), single-use, rate limit |
| OAuth (login social) | Delega identidade a terceiro | Validar `state` (CSRF) e `redirect_uri` exato |
| OIDC | OAuth + identidade padronizada (`id_token` JWT) | Validar `iss`, `aud`, `exp`, assinatura — nunca decodificar sem verificar |
| MFA (TOTP/SMS/WebAuthn) | Contas sensíveis, admin | WebAuthn > TOTP > SMS (SMS é vulnerável a SIM swap) |

```
// ❌ Comparar senha em texto puro ou hash fraco (MD5/SHA1 sem salt)
if (user.password === input) { ... }

// ✅ Hash com custo configurável, comparação em tempo constante
const ok = await argon2.verify(user.passwordHash, input);
```

## Sessão vs. JWT

| | Sessão (server-side) | JWT (stateless) |
|---|---|---|
| Revogação | Imediata (deletar no store) | Difícil — exige blocklist ou TTL curto |
| Escala | Precisa de store compartilhado (Redis) | Nenhum estado no servidor |
| Tamanho no request | Só o ID (cookie) | Payload inteiro a cada request |
| Uso típico | Apps monolíticas, sessão web | APIs, mobile, microsserviços |

Regras que valem para os dois:

- Cookie de sessão/refresh: `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict` — nunca acessível via JS
- Access token de vida curta (5-15 min) + refresh token de vida longa, rotacionado a cada uso
- Refresh token reuso detectado = revogar toda a família de tokens (sinal de roubo)
- JWT: sempre validar assinatura, `exp`, `iss`, `aud` no servidor — nunca confiar em payload decodificado sem checar assinatura

```
// ❌ Confiar no JWT só porque conseguiu decodificar
const payload = jwt.decode(token); // não verifica assinatura
if (payload.role === 'admin') { ... }

// ✅ Verificar assinatura e claims antes de usar qualquer campo
const payload = jwt.verify(token, publicKey, { issuer, audience });
```

## Autorização: RBAC vs. ABAC

- **RBAC** (role-based): usuário tem papel (`admin`, `editor`, `viewer`); papel define permissões fixas. Simples, bom pra 80% dos casos.
- **ABAC** (attribute-based): decisão depende de atributos do usuário/recurso/contexto (`owner_id == resource.owner_id`, `dept == resource.dept`, horário, IP). Necessário quando RBAC vira uma explosão de papéis (`admin-sp`, `admin-rj`, `editor-proprio-time`...).
- Multi-tenant: RBAC/ABAC sempre escopados por tenant — papel "admin" nunca é global, é "admin do tenant X".

```
// ❌ Checar só o papel, ignorar o dono do recurso
if (user.role === 'editor') return updateDoc(docId, data);

// ✅ Checar papel E relação com o recurso (ABAC sobre RBAC)
if (user.role === 'editor' && doc.ownerId === user.id) {
  return updateDoc(docId, data);
}
```

Autorização é decidida no servidor, sempre. UI escondendo botão não é controle de acesso — é UX.

## Onde a checagem vive

- Nunca só no client (esconder botão/rota não impede chamada direta à API)
- Nunca só em middleware de rota (deep-link ou chamada direta a outro endpoint escapa)
- Camada correta: no boundary que executa a ação (service/use case) ou na policy do banco (RLS) — idealmente nos dois, com o banco como última linha de defesa
- Toda ação sensível (delete, mudança de papel, exportar dados) reautentica ou exige confirmação adicional

## MFA e recuperação de conta

- MFA opcional para usuário comum, obrigatório para admin/papéis privilegiados
- Fluxo de "esqueci a senha" usa o mesmo rigor do login: token de único uso, expiração curta, invalida sessões antigas ao trocar a senha
- Nunca revelar se um e-mail/usuário existe na resposta de erro (`"email não encontrado"` vs. `"credenciais inválidas"`)

## Checklist

- [ ] Senha nunca armazenada em texto puro (argon2/bcrypt, nunca MD5/SHA1)
- [ ] Access token de vida curta; refresh token rotacionado e revogável
- [ ] Cookies de sessão/refresh com `HttpOnly` + `Secure` + `SameSite`
- [ ] JWT validado (assinatura, `exp`, `iss`, `aud`) antes de usar qualquer claim
- [ ] Autorização checada no servidor, não só escondida na UI
- [ ] Multi-tenant: papel/permissão sempre escopado por tenant, nunca global implícito
- [ ] Rate limit em login, OTP e reset de senha
- [ ] Erros de auth não vazam se o usuário/e-mail existe
- [ ] MFA disponível para contas sensíveis; obrigatório para admin
- [ ] Logout invalida sessão/refresh no servidor, não só limpa o client

## Exemplos por stack

**Postgres + RLS (autorização no banco, Supabase ou custom):**
```sql
-- RBAC checado na policy; o app seta o contexto por transação:
-- SET LOCAL app.current_user_id = '<uuid>';
CREATE POLICY "editor_own_docs" ON documents
  FOR UPDATE TO app_user
  USING (
    owner_id = current_setting('app.current_user_id')::uuid
    AND (SELECT role FROM profiles WHERE id = current_setting('app.current_user_id')::uuid) = 'editor'
  );
```

**NestJS + Passport (JWT + Guard):**
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
@Patch(':id')
update(@Param('id') id: string, @CurrentUser() user: User) {
  if (user.role !== 'admin' && user.id !== resourceOwnerId(id)) {
    throw new ForbiddenException();
  }
  // ...
}
```

**Keycloak/Auth0 (OIDC, validação de token em API Python/Flask):**
```python
# Nunca decodificar sem verificar — sempre validar contra o JWKS do provedor
payload = jwt.decode(
    token, key=jwks_client.get_signing_key_from_jwt(token).key,
    algorithms=["RS256"], audience=API_AUDIENCE, issuer=ISSUER,
)
if "admin" not in payload.get("realm_access", {}).get("roles", []):
    raise Forbidden()
```

## Anti-patterns

- ❌ Autorização decidida só no frontend (esconder botão)
- ❌ JWT decodificado sem verificar assinatura
- ❌ Access token de vida longa sem refresh/revogação
- ❌ Papel global ("admin") em sistema multi-tenant
- ❌ Senha ou token em log, texto puro no banco, ou querystring
- ❌ Mensagem de erro que revela se e-mail/usuário existe
- ❌ Refresh token reutilizável sem rotação nem detecção de reuso
- ❌ MFA via SMS como única opção para contas privilegiadas
- ❌ Sessão/refresh não invalidado no servidor após logout ou troca de senha
