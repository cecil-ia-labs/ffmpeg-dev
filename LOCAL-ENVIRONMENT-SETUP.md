# Configuração do Local Environment no ChatGPT Desktop / Codex

Este projeto inclui scripts próprios para que o **Codex local** consiga instalar dependências, validar FFmpeg/FFprobe e executar o gate completo de cada milestone usando a sua máquina.

## 1. Abra o Environment do projeto

No ChatGPT Desktop:

1. selecione **Codex**;
2. abra **Settings**;
3. entre em **Environments**;
4. selecione o Environment associado a este projeto;
5. clique em **Edit**.

A configuração gerada pelo app é armazenada pelo Codex em `.codex` na raiz do projeto. O app pode versionar essa configuração junto ao repositório.

## 2. Setup script

No campo **Setup script**, use:

```bash
npm run codex:setup
```

Esse comando executa `scripts/codex-environment-setup.mjs` e verifica:

- Node.js;
- npm;
- FFmpeg;
- FFprobe;
- `npm install`;
- `npm run build`.

O Setup script é especialmente importante para chats executados em **Worktree**, porque uma worktree nova precisa receber suas dependências antes dos testes.

## 3. Cleanup script

No campo **Cleanup script**, use:

```bash
npm run codex:cleanup
```

O cleanup remove apenas artefatos gerados (`dist`, `coverage` e caches conhecidos). Ele não remove `node_modules`, arquivos de mídia do usuário ou fontes do projeto.

## 4. Variables

Para o Milestone 8, nenhuma variável é obrigatória.

Se no futuro uma integração precisar de variáveis locais ou segredos, configure-os pelo mecanismo apropriado do Environment e não os grave no repositório.

## 5. Actions recomendadas

Na seção **Actions**, adicione:

| Nome | Comando |
|---|---|
| Build | `npm run build` |
| Type Check | `npm run check` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Validate | `npm run validate` |
| Doctor | `npm run doctor` |
| CLI Help | `npm run cli -- --help` |

A Action mais importante é **Validate**. Ela deve ser usada como gate de conclusão de cada milestone.

## 6. Worktree recomendado

Para desenvolver milestones novos sem alterar imediatamente o checkout principal:

1. abra um novo chat do Codex;
2. selecione **Worktree**;
3. selecione este Local Environment;
4. escolha a branch/commit de base;
5. envie a tarefa.

O Codex cria uma Git worktree isolada e executa o Setup script automaticamente.

## 7. Arquivos ignorados necessários em worktrees

Se futuramente o projeto usar um arquivo ignorado pelo Git, como `.env.local`, crie `.worktreeinclude` na raiz:

```gitignore
.env.local
```

Liste apenas arquivos ignorados que precisam ser copiados. Não use isso para arquivos já rastreados pelo Git.

## 8. Gate recomendado antes de aceitar um milestone

Use a Action **Validate** ou execute:

```bash
npm run validate
```

Para investigar uma falha isoladamente:

```bash
npm run check
npm run lint
npm test
npm run build
npm run verify:diagnostics
```

## 9. Verificação do FFmpeg local

```bash
which ffmpeg
which ffprobe
ffmpeg -version
ffprobe -version
```

Depois:

```bash
npm run doctor
```

Assim o toolkit e o Codex estarão validando exatamente o FFmpeg instalado na sua máquina, em vez do FFmpeg existente em um sandbox remoto.
