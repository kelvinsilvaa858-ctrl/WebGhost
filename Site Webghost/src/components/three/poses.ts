import { MathUtils } from 'three'

/**
 * Coreografia do objeto. Posições em fração da viewport (fx/fy: -1 → 1),
 * convertidas para mundo a cada frame — o objeto se adapta a qualquer proporção.
 */
export type Pose = {
  fx: number
  fy: number
  z: number
  scale: number
  rx: number
  ry: number
  rz: number
  ix: number // rotação da estrutura interna
  iy: number
  iz: number
  spread: number // separação em profundidade das camadas
  core: number // escala do núcleo
  opacity: number
  gain: number // quanto o objeto responde ao cursor
  spin: number // velocidade de rotação contínua (rad/s)
}

export const CAM_Z = 6
export const FOV = 32
export const TAN_HALF = Math.tan(MathUtils.degToRad(FOV / 2))

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ss = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = MathUtils.lerp
const easeIn = (t: number) => t * t * t

export const QUARTER = Math.PI / 4
/** recuo da peça na hero (mais longe da câmera); a travessia sai daqui até passar pela câmera */
export const HERO_Z = { desktop: -0.9, mobile: -0.6 }

export function heroPose(p: number, t: number, mobile: boolean, out: Pose): Pose {
  const align = ss(0, 0.3, p) // gira até ficar de frente
  const dolly = easeIn(clamp01((p - 0.32) / 0.52)) // câmera atravessa o vão do triângulo
  const idle = 1 - align

  // centrado, um pouco acima do meio: os botões ficam logo abaixo da peça
  const f = mobile ? { fx: 0, fy: 0.36, s: 0.4 } : { fx: 0, fy: 0.12, s: 0.74 }

  out.fx = lerp(f.fx, 0, align)
  out.fy = lerp(f.fy, 0, align)
  const z0 = mobile ? HERO_Z.mobile : HERO_Z.desktop
  out.z = lerp(z0, 7.4, dolly)
  out.scale = lerp(f.s, mobile ? 0.7 : 0.95, align)
  out.rx = lerp(0.06, 0, align)
  out.ry = lerp(-0.22, 0, align) + Math.sin(t * 0.3) * 0.08 * idle
  out.rz = dolly * 0.7
  out.ix = 0
  out.iy = Math.sin(t * 0.5) * 0.6 * idle
  out.iz = 0
  out.spread = 0
  out.core = 1 - ss(0.22, 0.34, p)
  out.opacity = 1 - ss(0.94, 1, p)
  out.gain = idle
  out.spin = 0
  return out
}

const base: Pose = {
  fx: 0, fy: 0, z: 0, scale: 0.5, rx: 0, ry: 0, rz: 0,
  ix: 0, iy: 0, iz: 0, spread: 0, core: 1, opacity: 1, gain: 1, spin: 0.15,
}

/** Fora da hero a peça não aparece: a interação 3D é exclusiva da primeira dobra. */
export const sectionPose = (): Pose => ({ ...base, opacity: 0 })

export const emptyPose = (): Pose => ({ ...base })
