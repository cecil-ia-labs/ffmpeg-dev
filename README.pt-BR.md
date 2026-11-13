# FFmpeg Media Toolkit

**Idiomas:** [English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md)

**Uma biblioteca TypeScript, CLI e conjunto de skills para operar FFmpeg/FFprobe com verificações reproduzíveis.** Mantida pela **Cecil-IA Labs**, sob licença MIT.

**[Media Processing Studio — showroom interativo](https://cecil-ia-labs.github.io/ffmpeg-dev/)** · **[GitHub](https://github.com/cecil-ia-labs/ffmpeg-dev)** · **[npm @cecilialabs/ffmpeg](https://www.npmjs.com/package/@cecilialabs/ffmpeg)**

## Conheça o Media Processing Studio

A SPA permite selecionar vídeos e áudios **diretamente do computador**, visualizar as mídias no navegador, ajustar os pontos de corte, ordenar até oito clipes de vídeo, incluir uma trilha sonora separada e gerar:

- comandos FFmpeg nativos para Bash;
- um script `.sh` que o usuário executa localmente;
- um pipeline YAML v1 do toolkit quando o projeto utiliza um único vídeo sem áudio externo.

A página **não envia arquivos** ao servidor, não renderiza nem exporta o vídeo processado. O navegador oferece uma prévia da mídia selecionada, não uma renderização precisa de toda a composição. Os comandos produzidos dependem das capacidades do FFmpeg instalado no computador.

Para segurança, o usuário deve colocar as mídias em uma pasta de trabalho, confirmar os nomes e revisar o comando antes de executá-lo. O gerador impede, por padrão, que o nome da saída coincida com o de uma entrada. Para múltiplos vídeos, o comando exportado descarta o áudio original, salvo quando uma trilha externa é adicionada. A aplicação sinaliza essa limitação.

## Instalando a biblioteca/CLI

Pré-requisitos: **Node.js 22+** e **FFmpeg/FFprobe 6.1+** (as funcionalidades disponíveis dependem da compilação instalada).

```bash
npm install -g @cecilialabs/ffmpeg
cecilia-ffmpeg doctor
```

Sem instalação global:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg doctor
```

**Estado da versão:** o `package.json` do repositório declara 2.0.0, com validação de release preparada; o estado exato de publicação deve ser confirmado no registro npm antes de afirmar que essa versão está distribuída.

## API operacional

O CLI fornece inspeção, edição de vídeo, áudio, conversão, composição, diagnósticos, streaming, e pipelines validados.

```bash
cecilia-ffmpeg probe input.mp4
cecilia-ffmpeg video trim input.mp4 --start 3 --duration 12
cecilia-ffmpeg video upscale input.mp4 --resolution 1920x1080
cecilia-ffmpeg compose concat intro.mp4 outro.mp4 --to mp4
cecilia-ffmpeg pipeline project.yaml validate
cecilia-ffmpeg pipeline project.yaml run --dry-run
```

`--dry-run` prepara/valida sem garantir que um arquivo tenha sido produzido. Operações reais fazem pré-verificação com FFprobe e verificam o artefato final. Use `--json` para resultados estruturados.

## Skills de IA

O toolkit inclui dez skills operacionais em [skills/](skills/) para onboarding, roteamento, ambiente, vídeo, áudio, conversão, composição, streaming, diagnósticos e pipelines. Elas se baseiam no runtime tipado e em scripts associados.

O conjunto separado **[.agents/skills/](.agents/skills/)** contém skills de manutenção deste repositório e do showroom; não substitui as skills de execução distribuídas com o pacote.

## Guias e desenvolvimento

- [Introdução](docs/getting-started.md) e [instalação](docs/installation.md)
- [Referência do CLI](docs/cli-reference.md) e [pipelines YAML](docs/pipelines.md)
- [Edição de vídeo](docs/video.md), [áudio](docs/audio.md) e [composição](docs/composition.md)
- [Fluxos para agentes](docs/agent-workflows.md) e [catálogo de skills](docs/skill-catalog.md)
- [Limitações do showroom](showcase/README.md), [instruções para agentes](AGENTS.md) e [changelog](CHANGELOG.md)

## Licença e responsabilidade

[MIT](LICENSE). © Cecil-IA Labs e colaboradores. O usuário mantém o controle dos arquivos e deve verificar licenças dos próprios conteúdos, codec disponíveis e caminhos locais. A SPA é uma ferramenta de autoria de comandos, não serviço remoto de edição ou armazenamento.
