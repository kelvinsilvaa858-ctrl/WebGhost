/**
 * Estado compartilhado entre o DOM (GSAP/ScrollTrigger) e a cena 3D.
 * É um objeto mutável de propósito: o GSAP escreve, o useFrame lê,
 * e nada disso passa pelo ciclo de render do React.
 */
export type PoseName = 'hidden'

type Listener = () => void

export const rig = {
  /** progresso do scroll dentro da hero pinada (0 → 1) */
  heroP: 0,
  /** 'hero' = pose calculada pelo scroll · 'section' = pose por seção com damping */
  mode: 'hero' as 'hero' | 'section',
  pose: 'hidden' as PoseName,
  /** ponteiro normalizado (-1 → 1) */
  pointer: { x: 0, y: 0 },
  /** 0 → 1, animado depois do loader */
  intro: 0,
  /** sinaliza troca de modo hero → seção para reposicionar o objeto fora de quadro */
  teleport: false,
  /** velocidade do scroll (Lenis) — dá inércia física à peça */
  velocity: 0,
  /** arraste do triângulo na hero: ângulos pedidos pelo usuário enquanto segura */
  drag: { active: false, x: 0, y: 0 },
  reduced: false,
}

const listeners = new Set<Listener>()
export const onRigWake = (fn: Listener) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
/** acorda o render loop (a cena para de renderizar quando o objeto está oculto) */
export const wakeRig = () => listeners.forEach((fn) => fn())

export function setPose(p: PoseName) {
  if (rig.pose === p) return
  rig.pose = p
  if (p !== 'hidden') wakeRig()
}

export function setMode(m: 'hero' | 'section') {
  if (rig.mode === m) return
  if (m === 'section') rig.teleport = true
  rig.mode = m
  wakeRig()
}
