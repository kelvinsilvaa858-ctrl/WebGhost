import { useRef } from 'react'
import { stats } from '../data/content'
import { gsap, useGSAP } from '../lib/scroll'
import { mq } from '../lib/device'

/** Três palavras entram em tempos e direções diferentes — profundidade por velocidade. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`not all and ${mq.reduce}`, () => {
        const words = gsap.utils.toArray<HTMLElement>('.man__word')
        const from = [-18, 22, -10]
        words.forEach((w, i) => {
          gsap.fromTo(w, { xPercent: from[i], opacity: 0.08 }, {
            xPercent: 0, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: w, start: 'top 95%', end: 'top 40%', scrub: true },
          })
        })
        gsap.from('.man__plus', {
          scale: 0, rotate: -90, stagger: 0.2, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: '.man__words', start: 'top 60%', once: true },
        })
        // números contam uma vez só
        gsap.utils.toArray<HTMLElement>('.man__stat strong').forEach((el) => {
          const to = Number(el.dataset.to)
          const o = { v: 0 }
          gsap.to(o, {
            v: to, duration: 1.6, ease: 'power3.out',
            onUpdate: () => (el.firstChild!.textContent = String(Math.round(o.v))),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          })
        })
        gsap.from('.man__rule', { scaleX: 0, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.man__stats', start: 'top 90%', once: true } })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} className="man" data-index="06" data-label="Diferencial" aria-label="Diferencial">
      <div className="man__words">
        <p className="man__word man__word--1">Design</p>
        <span className="man__plus" aria-hidden="true">+</span>
        <p className="man__word man__word--2">Tecnologia</p>
        <span className="man__plus man__plus--2" aria-hidden="true">+</span>
        <p className="man__word man__word--3">Performance</p>
      </div>

      <div className="man__stats">
        <span className="man__rule" aria-hidden="true" />
        {stats.map((s) => (
          <div className="man__stat" key={s.label}>
            <strong className="tnum" data-to={s.value}>
              <span>{s.value}</span>
              {s.suffix}
            </strong>
            <span className="micro">{s.label}</span>
          </div>
        ))}
        <p className="man__note">
          Cada decisão visual passa pelo mesmo filtro: precisa ser bonita, precisa funcionar e precisa carregar rápido.
        </p>
      </div>
    </section>
  )
}
