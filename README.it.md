# FFmpeg Media Toolkit

**Lingue:** [English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md)

**Una libreria TypeScript, CLI e raccolta di skill per flussi FFmpeg/FFprobe verificabili e riproducibili.** Mantenuta da **Cecil-IA Labs**, con licenza MIT.

**[Media Processing Studio — showroom interattivo](https://cecil-ia-labs.github.io/ffmpeg-dev/)** · **[GitHub](https://github.com/cecil-ia-labs/ffmpeg-dev)** · **[npm @cecilialabs/ffmpeg](https://www.npmjs.com/package/@cecilialabs/ffmpeg)**

## Media Processing Studio

La SPA carica video e audio **soltanto nel browser**. Consente di riprodurre i file, impostare i punti d'ingresso e uscita, ordinare fino a otto clip video, aggiungere una traccia audio e generare:

- comandi FFmpeg nativi per Bash;
- script `.sh` eseguibili localmente;
- pipeline YAML v1 del toolkit, per un solo input video e senza traccia audio esterna.

**Nessun caricamento su server** è necessario. Il browser visualizza il file selezionato, ma non esegue la composizione finale né rende gli effetti tramite FFmpeg. L'output è codice da esaminare ed eseguire sul computer dell'utente.

I file devono essere disponibili nella directory di lavoro con i nomi usati nel comando; il browser non comunica il percorso assoluto. La generazione impedisce di usare come output il nome di un input. In sequenze multivideo il comando non mantiene automaticamente l'audio dei file sorgente: è possibile fornire una traccia audio esterna.

## Installazione

Prerequisiti: **Node.js 22+** e **FFmpeg/FFprobe 6.1+**. Le capacità dei codec dipendono dalla distribuzione FFmpeg installata.

```bash
npm install -g @cecilialabs/ffmpeg
cecilia-ffmpeg doctor
```

Senza installazione globale:

```bash
npm exec --yes --package=@cecilialabs/ffmpeg -- cecilia-ffmpeg doctor
```

**Versione:** il repository attualmente dichiara `2.0.0` nel suo `package.json`, con preparazione della release completata. Verificare separatamente l'effettiva disponibilità di tale versione nel registro npm.

## Utilizzo del CLI

```bash
cecilia-ffmpeg probe input.mp4
cecilia-ffmpeg video trim input.mp4 --start 3 --duration 12
cecilia-ffmpeg video upscale input.mp4 --resolution 1920x1080
cecilia-ffmpeg compose concat intro.mp4 outro.mp4 --to mp4
cecilia-ffmpeg pipeline project.yaml validate
cecilia-ffmpeg pipeline project.yaml run --dry-run
```

La modalità `--dry-run` valida il piano, ma non produce un file. L'esecuzione reale verifica la sorgente con FFprobe e controlla l'artefatto finale. `--json` restituisce risultati strutturati.

## Skill per agenti

Il toolkit include dieci skill operative in [skills/](skills/) per onboarding, routing, ambiente, video, audio, conversione, composizione, streaming, diagnostica e pipeline. Usano il runtime tipizzato e gli script associati.

Le skill separate in **[.agents/skills/](.agents/skills/)** sono istruzioni per mantenere questo progetto e il suo showroom, non componenti del pacchetto operativo.

## Documentazione

- [Guida introduttiva](docs/getting-started.md) e [installazione](docs/installation.md)
- [Riferimento CLI](docs/cli-reference.md) e [pipeline YAML](docs/pipelines.md)
- [Video](docs/video.md), [audio](docs/audio.md), [composizione](docs/composition.md)
- [Flussi per agenti](docs/agent-workflows.md) e [catalogo skills](docs/skill-catalog.md)
- [Limiti dello showroom](showcase/README.md), [AGENTS.md](AGENTS.md) e [changelog](CHANGELOG.md)

## Licenza

[MIT](LICENSE). © Cecil-IA Labs e collaboratori. È responsabilità dell'utente verificare i propri contenuti, i codec disponibili e i percorsi locali. La SPA è un autore di comandi, non un servizio remoto di elaborazione media.
