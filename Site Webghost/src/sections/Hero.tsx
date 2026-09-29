import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/scroll'
import { rig, setMode, setPose } from '../lib/rig'
import { matches, mq } from '../lib/device'
import { MagneticButton } from '../components/MagneticButton'
import { WHATSAPP_URL } from '../data/content'
import { SplitWords } from '../components/SplitWords'
import { go } from '../components/Nav'

const Icon = {
  screen: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  ),
  code: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />
    </svg>
  ),
  cube: () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </svg>
  ),
}

const SERVICES = [
  { icon: Icon.screen, title: 'Sites personalizados', desc: 'Design sob medida, performance e foco em gerar contatos.' },
  { icon: Icon.code, title: 'Sistemas sob medida', desc: 'Automatize processos e leve seu negócio para o próximo nível.' },
  { icon: Icon.cube, title: 'Experiências digitais', desc: 'Animações 3D, interatividade e tecnologia que impressiona.' },
]

/**
 * Hero: só o triângulo 3D interativo no centro e as duas ações logo abaixo.
 * No scroll, os botões saem, a câmera atravessa o vão e a frase aparece lá dentro.
 */
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.set('.hero__ctas > *, .hero__fade', { opacity: 0, y: 14 })
      gsap.set('.hero__title .w__i', { yPercent: 110 })
      gsap.set('.hero__svc', { opacity: 0, x: 18 })
      gsap.set('.hero__rule', { scaleY: 0 })
    },
    { scope: root },
  )

  // entrada: a peça acende primeiro, as ações aparecem depois
  useGSAP(
    () => {
      if (!ready) return
      if (matches(mq.reduce)) {
        gsap.set('.hero__ctas > *, .hero__fade, .hero__svc', { opacity: 1, x: 0, y: 0 })
        gsap.set('.hero__title .w__i', { yPercent: 0 })
        gsap.set('.hero__rule', { scaleY: 1 })
        rig.intro = 1
        return
      }
      // a peça acende; o texto entra da esquerda para a direita, como uma leitura
      gsap
        .timeline()
        .to(rig, { intro: 1, duration: 2.4, ease: 'power3.out' }, 0)
        .to('.hero__kicker', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.45)
        .to('.hero__title .w__i', { yPercent: 0, duration: 1.1, stagger: 0.05, ease: 'expo.out' }, 0.55)
        .to('.hero__rule', { scaleY: 1, duration: 1.1, ease: 'expo.inOut' }, 0.8)
        .to('.hero__lede', { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.95)
        .to('.hero__svc', { opacity: 1, x: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, 1.05)
        .to('.hero__ctas > *', { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power2.out' }, 1.25)
    },
    { scope: root, dependencies: [ready] },
  )

  // scroll: a câmera atravessa o vão do triângulo
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ reduce: mq.reduce, mobile: mq.mobile, desktop: mq.desktop }, (ctx) => {
        const { reduce, mobile } = ctx.conditions as { reduce: boolean; mobile: boolean }
        const trig = {
          trigger: root.current,
          // sai da hero sem pose herdada: a peça só volta quando Serviços realmente entra
          onLeave: () => {
            setPose('hidden')
            setMode('section')
          },
          onEnterBack: () => setMode('hero'),
        }
        if (reduce) {
          gsap.timeline({ scrollTrigger: { ...trig, start: 'top top', end: 'bottom top' } })
          return
        }
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              ...trig,
              start: 'top top',
              end: mobile ? '+=160%' : '+=220%',
              pin: true,
              // a trava da hero muda de tamanho entre celular e computador e é recriada quando a
              // janela cruza esse limite: ela precisa ser recalculada ANTES de todas as outras,
              // senão as seções de baixo (ex.: Serviços) são medidas sem o espaço dela e invadem a hero
              refreshPriority: 10,
              scrub: true,
              onUpdate: (s) => (rig.heroP = s.progress),
            },
          })
          // os textos saem antes da câmera entrar no vão
          .to('.hero__intro', { x: -40, opacity: 0, filter: 'blur(6px)', duration: 0.18 }, 0)
          .to('.hero__services', { x: 40, opacity: 0, filter: 'blur(6px)', duration: 0.18 }, 0)
          .to('.hero__ctas', { y: 40, opacity: 0, filter: 'blur(6px)', duration: 0.18 }, 0)
          // a frase só surge quando as bordas do vão já saíram do quadro (câmera dentro do triângulo)
          .fromTo('.hero__statement', { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.76)
          .fromTo('.hero__statement .w__i', { yPercent: 110 }, { yPercent: 0, stagger: 0.012, duration: 0.08, ease: 'power2.out' }, 0.76)
          .set({}, {}, 1)
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  // arrastar em qualquer ponto da hero gira o triângulo (menos sobre os botões)
  const start = useRef({ x: 0, y: 0, rx: 0, ry: 0 })
  const onDown = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as Element).closest('a, button') || rig.heroP > 0.04) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, rx: 0, ry: 0 }
    rig.drag.active = true
    rig.drag.x = 0
    rig.drag.y = 0
    root.current!.classList.add('is-dragging')
  }
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!rig.drag.active) return
    const s = 0.009 // radianos por pixel
    rig.drag.y = (e.clientX - start.current.x) * s
    rig.drag.x = (e.clientY - start.current.y) * s
  }
  const onUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!rig.drag.active) return
    rig.drag.active = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    root.current!.classList.remove('is-dragging')
    window.dispatchEvent(new Event('wg:drag-release'))
  }

  return (
    <section
      ref={root}
      id="top"
      className="hero"
      data-index="01"
      data-label="Início"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* apresentação — o h1 leva as palavras-chave do serviço */}
      <div className="hero__intro">
        <h1 className="hero__title">
          <span className="hero__kicker hero__fade">Criação de sites · Sistemas · Experiências digitais</span>
          <SplitWords text="Sua ideia merece" className="line hero__t1" />
          <SplitWords text="uma presença digital." className="line hero__t2" />
        </h1>
        <div className="hero__body">
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__lede hero__fade">
            A WebGhost cria sites, sistemas e experiências digitais que unem design, tecnologia e estratégia para
            transformar visitantes em clientes.
          </p>
        </div>
      </div>

      {/* os três serviços, ao lado da peça */}
      <ul className="hero__services" aria-label="Serviços">
        {SERVICES.map(({ icon: I, title, desc }) => (
          <li className="hero__svc" key={title}>
            <a href="#servicos" onClick={go}>
              <span className="hero__svc-icon"><I /></span>
              <span className="hero__svc-text">
                <strong>{title}</strong>
                <span>{desc}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="hero__ctas">
        <MagneticButton href={WHATSAPP_URL} external>
          Começar um projeto <span className="hero__arrow" aria-hidden="true">→</span>
        </MagneticButton>
        <a href="#projetos" onClick={go} className="ulink hero__link">
          Ver projetos <span className="hero__arrow" aria-hidden="true">→</span>
        </a>
      </div>

      <p className="hero__statement" aria-hidden="true">
        <SplitWords text="WebGhost transforma ideias" className="line" />
        <SplitWords text="em experiências digitais." className="line" />
      </p>
    </section>
  )
}
