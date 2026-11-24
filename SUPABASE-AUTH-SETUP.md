# Supabase Auth e RLS — GT TREINOS

## Estado da migração
O frontend da branch `start-personalizado` foi preparado para usar Supabase Auth. O banco remoto ainda não foi alterado porque a conexão disponível nesta sessão não tem permissão no projeto indicado pela aplicação.

## Execução obrigatória antes de ativar o app
1. Abra o projeto Supabase cuja URL corresponde a `VITE_SUPABASE_URL`.
2. Faça backup do banco.
3. Confira se as tabelas `trainings`, `exercises`, `loads`, `history` e `users` existem e têm a coluna `userEmail`.
4. Revise o arquivo `SUPABASE-AUTH-RLS-MIGRATION.sql`.
5. Execute-o no SQL Editor desse projeto.
6. Rode os Security Advisors e teste com duas contas diferentes se cada usuário só acessa seus dados.
7. No Authentication → URL Configuration, inclua os domínios de desenvolvimento e da Vercel.

O script tem validações iniciais e roda em transação. Mesmo assim, revise e faça backup antes da execução.

## Migração de usuários existentes
As senhas antigas armazenadas na tabela pública `users` não são transferidas para Supabase Auth. Cada usuário precisa criar/confirmar uma conta usando o mesmo e-mail antigo. Após a confirmação, a função de trigger migra o perfil e vincula os dados antigos pelo e-mail. O campo de senha em texto puro é removido da tabela antiga.

## Variáveis para Vercel
Configure em Development, Preview e Production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (ou a chave publicável gerada pelo projeto)

Nunca use `service_role`, secret key ou senha do banco em qualquer variável `VITE_*`; elas são incorporadas ao JavaScript entregue ao navegador.

## Verificação de produção
O build Vite sem segredos pode passar sem essas variáveis, mas login, cadastro, recuperação, leitura de perfil e RLS só podem ser testados depois da configuração e da migração no projeto Supabase correto.
