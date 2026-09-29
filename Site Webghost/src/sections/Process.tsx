import { useRef, useState } from 'react'
import { process } from '../data/content'
import { gsap, ScrollTrigger, useGSAP } from '../lib/scroll'

/**
 * Coluna fixa (sticky, sem pin do GSAP) + etapas que rolam ao lado.
 * A linha fina cresce com o progresso; o número desliza num rolo mascarado
 * (sem animação de layout — estável mesmo com scroll rápido).
 */
export function Process() {
  const root = useRef<HTMLElement>(null)
  const line = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: '.proc__steps',
        start: 'top 55%',
        end: 'bottom 55%',
        onUpdate: (s) => {
          if (line.current) line.current.style.transform = `scaleY(${s.progress})`
        },
      })
      gsap.utils.toArray<HTMLElement>('.proc__step').forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) => s.isActive && setActive(i),
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="processo" className="proc" data-index="04" data-label="Processo">
      <div className="proc__aside">
        <div className="proc__sticky">
          <h2 className="h-sec">Nosso processo</h2>
          {/* contador em rolo: todos os números empilhados, a máscara mostra só o ativo */}
          <div className="proc__num tnum" aria-hidden="true">
            <div className="proc__reel" style={{ transform: `translateY(${-active * 0.8}em)` }}>
              {process.map((_, i) => (
                <span key={i}>{String(i + 1).padStart(2, '0')}</span>
              ))}
            </div>
          </div>
          <p className="micro tnum proc__of">de {String(process.length).padStart(2, '0')} etapas</p>
        </div>
      </div>

      <ol className="proc__steps">
        <span className="proc__rail" aria-hidden="true"><span ref={line} className="proc__line" /></span>
        {process.map((s, i) => (
          <li key={s.name} className={`proc__step ${active === i ? 'is-active' : ''}`}>
            <span className="proc__dot" aria-hidden="true" />
            <span className="micro tnum proc__i">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="proc__name">{s.name}</h3>
            <p className="proc__desc">{s.desc}</p>
            <p className="proc__out micro">Entrega <span>{s.out}</span></p>
          </li>
        ))}
      </ol>
    </section>
  )
}
