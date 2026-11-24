# GT TREINOS START

Módulo de organização semanal e checklist integrado ao frontend Vite.

## Segurança
- Cadastro, login, logout e recuperação de senha preparados para Supabase Auth.
- Perfil associado ao UUID de Auth.
- APIs de treinos, exercícios, cargas e histórico filtram pelo UUID autenticado.
- RLS por `owner_id` definido no script de migração.

## Importante
Antes de ativar o novo fluxo, execute e valide `SUPABASE-AUTH-RLS-MIGRATION.sql` no projeto Supabase correto. A integração não está pronta para produção enquanto essa migração e os testes de isolamento não forem executados.

## Build
GitHub Actions executa `npm ci` e `npm run build` em pushes para a branch de integração e no Pull Request.
