/** Abre/fecha a página "Todos os projetos" (estado global mínimo, sem biblioteca). */
type Fn = (open: boolean) => void
const subs = new Set<Fn>()
let isOpen = false

export const onProjectsIndex = (fn: Fn) => {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}
export const setProjectsIndex = (open: boolean) => {
  isOpen = open
  subs.forEach((fn) => fn(open))
}
export const projectsIndexOpen = () => isOpen
