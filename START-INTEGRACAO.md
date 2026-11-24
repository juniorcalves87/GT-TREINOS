# GT TREINOS START

Módulo de organização semanal e checklist integrado ao frontend Vite existente.

## Conteúdo
- Referências de medidas lidas do perfil local do usuário após login, sem dados pessoais fixos no código versionado.
- Estrutura semanal demonstrativa com foco em progressão gradual e atividades previamente autorizadas.
- Checklist diário salvo no navegador por meio de localStorage.
- Princípios gerais de alimentação, sem dieta, calorias ou macros individualizados.

## Integração
O módulo é carregado por `index.html`, participa da navegação SPA em `src/js/pages.js` e usa estilos isolados em `src/css/start-mode.css`. Os módulos originais de treino, exercícios e Supabase permanecem separados.

## Saúde e segurança
O conteúdo é informativo e não substitui avaliação clínica. Exercícios, cargas, amplitudes e progressão precisam ser definidos por profissional habilitado conforme a condição individual. Interrompa atividades diante de sintomas relevantes.

## Verificação
O workflow `.github/workflows/validate-build.yml` executa `npm ci` e `npm run build` em pushes para a branch de integração e em pull requests para `patch-1`.
