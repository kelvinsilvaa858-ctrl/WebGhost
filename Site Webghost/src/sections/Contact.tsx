import { useRef } from 'react'
import { WHATSAPP_URL } from '../data/content'
import { gsap, useGSAP } from '../lib/scroll'
import { mq } from '../lib/device'
import { SplitWords } from '../components/SplitWords'
import { MagneticButton } from '../components/MagneticButton'

/**
 * Fechamento com luz: a iluminação é guiada pelo scroll. Ao chegar na seção,
 * cada pedaço rolado acende um pouco mais a luz, até a frase ficar iluminada.
 */
export function Contact() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`not all and ${mq.reduce}`, () => {
        // tudo apagado até a seção chegar
        gsap.set('.ct__light', { opacity: 0 })
        gsap.set('.ct__beam', { scaleX: 0.35, scaleY: 0.5 })
        gsap.set('.ct__halo, .ct__bulb', { scale: 0.5 })
        gsap.set('.ct__title', { opacity: 0.1 })
        gsap.set('.ct__fade', { opacity: 0, y: 16 })

        // a luz acompanha o scroll: rolando para baixo ela vai acendendo aos poucos,
        // rolando para cima ela volta a apagar
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'top 5%', scrub: 0.8 },
          })
          .to('.ct__light', { opacity: 1, duration: 1, ease: 'power1.in' }, 0)
          .to('.ct__beam', { scaleX: 1, scaleY: 1, duration: 1, ease: 'power2.out' }, 0)
          .to('.ct__halo, .ct__bulb', { scale: 1, duration: 1, ease: 'power2.out' }, 0)
          .to('.ct__title', { opacity: 1, duration: 0.85, ease: 'power1.in' }, 0.1)
          .to('.ct__fade', { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }, 0.72)
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="contato" className="ct" data-index="07" data-label="Contato">
      <div className="ct__lamp" aria-hidden="true">
        <div className="ct__light">
          <div className="ct__beam-wrap">
            <div className="ct__beam" />
          </div>
          <div className="ct__halo" />
          <div className="ct__bulb" />
        </div>
      </div>

      <h2 className="ct__title">
        <SplitWords text="Vamos criar" className="line" />
        <SplitWords text="algo fora" className="line" />
        <SplitWords text="do comum." className="line" />
      </h2>

      <div className="ct__fade ct__cta">
        <MagneticButton href={WHATSAPP_URL} external size="xl">
          Começar um projeto →
        </MagneticButton>
      </div>
    </section>
  )
}
