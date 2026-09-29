/** Progresso real de carregamento (sem espera artificial). */
type Fn = (v: number) => void
const needed = ['fonts', 'scene', 'window']
const steps = new Set<string>()
const subs = new Set<Fn>()
const value = () => [...steps].filter((k) => needed.includes(k)).length / needed.length

export const markLoaded = (key: string) => {
  steps.add(key)
  const v = value()
  subs.forEach((fn) => fn(v))
}
export const onLoadProgress = (fn: Fn) => {
  subs.add(fn)
  fn(value())
  return () => {
    subs.delete(fn)
  }
}
export const forceLoaded = () => needed.forEach(markLoaded)
