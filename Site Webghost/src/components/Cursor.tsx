import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll'
import { matches, mq } from '../lib/device'

// só projetos e serviços ganham rótulo; links e botões mantêm a bolinha (que só cresce um pouco)
const LABELS: Record<string, string> = { view: 'View', explore: 'Explore' }

const labelAt = (el: Element | null) => {
  const t = el?.closest<HTMLElement>('[data-cursor]')
  return t ? LABELS[t.dataset.cursor ?? ''] ?? '' : ''
}
const isLink = (el: Element | null) => !!el?.closest('a, button')

/**
 * Cursor pequeno com rótulo contextual. Só existe em ponteiro fino (desktop).
 * - o cursor nativo só é escondido depois do primeiro movimento (nunca fica "sem cursor")
 * - fica acima de tudo, inclusive do loader e da transição
 * - usa difference sempre: continua visível sobre fundos claros (botões brancos, luz)
 * - recalcula o rótulo quando a página rola sob o mouse parado
 * - classes de estado (is-on, is-down, has-label) só por classList: o React não as sobrescreve
 */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const [enabled] = useState(() => matches(mq.finePointer))
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!enabled) return
    const el = root.current!
    const html = document.documentElement
    const reduced = matches(mq.reduce)
    const xTo = gsap.quickTo(el, 'x', { duration: reduced ? 0 : 0.3, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: reduced ? 0 : 0.3, ease: 'power3.out' })
    let shown = false
    let last = { x: -100, y: -100 }
    let raf = 0

    const show = (x: number, y: number) => {
      if (shown) return
      shown = true
      gsap.set(el, { x, y }) // aparece já no lugar certo, sem vir deslizando do canto
      el.classList.add('is-on')
      html.classList.add('has-cursor')
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      last = { x: e.clientX, y: e.clientY }
      show(e.clientX, e.clientY)
      xTo(e.clientX)
      yTo(e.clientY)
    }
    const over = (e: MouseEvent) => {
      const t = e.target as Element
      setLabel(labelAt(t))
      el.classList.toggle('is-link', isLink(t))
    }
    const hide = () => {
      shown = false
      el.classList.remove('is-on')
      html.classList.remove('has-cursor') // fora da janela, o nativo volta
    }
    const leaveDoc = (e: MouseEvent) => {
      if (!e.relatedTarget) hide()
    }
    // a página rolou sob o mouse parado: atualiza o rótulo pelo que está embaixo agora
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (!shown) return
        const t = document.elementFromPoint(last.x, last.y)
        setLabel(labelAt(t))
        el.classList.toggle('is-link', isLink(t))
      })
    }
    const down = () => el.classList.add('is-down')
    const up = () => el.classList.remove('is-down')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', leaveDoc)
    window.addEventListener('blur', hide)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', leaveDoc)
      window.removeEventListener('blur', hide)
      html.classList.remove('has-cursor')
    }
  }, [enabled])

  // o rótulo muda a classe por código, igual a is-on/is-down: se o React controlasse
  // className, cada troca de rótulo apagaria is-on e o cursor sumiria
  useEffect(() => {
    root.current?.classList.toggle('has-label', !!label)
  }, [label])

  if (!enabled) return null
  return (
    <div ref={root} className="cursor" aria-hidden="true">
      <div className="cursor__body">
        {label && (
          <span key={label} className="cursor__label">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
