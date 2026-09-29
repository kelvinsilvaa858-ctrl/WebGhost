export const mq = {
  desktop: '(min-width: 900px)',
  mobile: '(max-width: 899px)',
  reduce: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
}

export const matches = (q: string) =>
  typeof window !== 'undefined' && window.matchMedia(q).matches

/** heurística simples de aparelho modesto: menos núcleos ou pouca memória */
export const isLowPower = () => {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency ?? 8
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return cores <= 4 || mem <= 4
}

export const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
