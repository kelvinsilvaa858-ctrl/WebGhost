# WebGhost — landing page

Vite + React 19 + TypeScript · React Three Fiber + drei + postprocessing · GSAP/ScrollTrigger · Lenis · Motion

## Rodar

```bash
npm install          # .npmrc já inclui legacy-peer-deps
npm run dev
npm run build        # build de produção em /dist
npm run build:single # um único index.html autocontido em /dist-single
```

## Estrutura

```
src/
  data/content.ts          ← todo o texto (serviços, projetos, processo, contato)
  lib/rig.ts               ← estado compartilhado DOM ↔ cena 3D (o GSAP escreve, o useFrame lê)
  lib/scroll.ts            ← Lenis + ScrollTrigger
  components/three/
    geometry.ts            ← moldura triangular e núcleo
    poses.ts               ← coreografia do objeto por seção / progresso da hero
    Beacon.tsx             ← peça luminosa (triângulo + núcleo), mouse, pausa do render
    Scene.tsx              ← canvas fixo único, bloom, DPR adaptativo
  components/              ← Loader, Nav, Cursor, SideIndex, MagneticButton, SplitWords
  sections/                ← Hero, Services, Projects, Process, About, Manifesto, Contact, Footer
  styles/                  ← tokens, base, componentes, hero, seções
```

## 3D

O triângulo vive só na hero: reage ao cursor e, no scroll, a câmera atravessa o vão
(`heroPose` em `poses.ts`). Ao sair da hero ele some e o render do canvas para.

## Pendências

- Capas dos projetos (`sections/ProjectCover.tsx`) são provisórias em HTML — trocar por screenshots `.webp` com `loading="lazy"`.
- E-mail e links de redes em `data/content.ts`.
- Next.js: os componentes portam direto (`'use client'` nas seções e `dynamic(() => import('./Scene'), { ssr: false })`); mover os imports de CSS para `app/layout.tsx`.
