import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../lib/scroll'

/** Indicador lateral: seção atual, total e progresso da página. */
export function SideIndex() {
  const [cur, setCur] = useState({ i: '01', label: 'Início' })
  const bar = useRef<HTMLSpanElement>(null)
  const [total, setTotal] = useState('00')

  useEffect(() => {
    const secs = [...document.querySelectorAll<HTMLElement>('[data-index]')]
    setTotal(String(secs.length).padStart(2, '0'))
    const sts = secs.map((s) =>
      ScrollTrigger.create({
        trigger: s,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setCur({ i: s.dataset.index!, label: s.dataset.label! }),
      }),
    )
    const prog = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (bar.current) bar.current.style.transform = `scaleY(${self.progress})`
      },
    })
    return () => {
      sts.forEach((s) => s.kill())
      prog.kill()
    }
  }, [])

  return (
    <aside className={`side ${cur.i === '01' ? 'is-hidden' : ''}`} aria-hidden="true">
      <span className="side__num">{cur.i}</span>
      <span className="side__track"><span ref={bar} className="side__bar" /></span>
      <span className="side__num side__num--dim">{total}</span>
      <span className="side__label">{cur.label}</span>
    </aside>
  )
}
