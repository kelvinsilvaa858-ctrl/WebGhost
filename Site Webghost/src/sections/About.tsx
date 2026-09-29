import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/scroll'
import { mq } from '../lib/device'
import { SplitWords } from '../components/SplitWords'

export function About() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`not all and ${mq.reduce}`, () => {
        // cada palavra acende conforme o scroll — leitura no ritmo de quem rola
        gsap.fromTo(
          '.about__statement .w__i',
          { opacity: 0.12 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: 'none',
            scrollTrigger: { trigger: '.about__statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
          },
        )
        gsap.from('.about__cols > *', {
          opacity: 0, y: 16, stagger: 0.1, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: '.about__cols', start: 'top 85%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="sobre" className="about" data-index="05" data-label="Sobre">
      <h2 className="sr-only">Sobre a WebGhost</h2>
      <p className="about__statement">
        <SplitWords text="Não criamos apenas sites." className="line" />
        <SplitWords text="Criamos experiências digitais." className="line about__dim" />
      </p>
      <div className="about__cols">
        <p>
          A WebGhost é um estúdio pequeno de propósito. Cada projeto é desenhado e programado pelas mesmas mãos,
          do primeiro rascunho ao último deploy.
        </p>
        <p>
          Nada sai de um tema pronto. Estrutura, movimento e código são pensados para uma marca de cada vez — é o
          que faz um site parecer seu.
        </p>
      </div>
    </section>
  )
}
