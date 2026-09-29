import { Fragment, useEffect, useRef, useState } from 'react'
import { services } from '../data/content'
import { gsap, ScrollTrigger, useGSAP } from '../lib/scroll'
import { mq } from '../lib/device'

export function Services() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(-1)
  // true enquanto a seção está travada e o scroll comanda qual serviço fica aberto
  const scrollDriven = useRef(false)

  const list = useRef<HTMLOListElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  // travada: se o serviço aberto não couber na tela, a lista sobe só o necessário
  useEffect(() => {
    const ol = list.current
    const box = inner.current // título + lista sobem juntos, sem sobrepor
    if (!ol || !box) return
    if (!scrollDriven.current || active < 0) {
      gsap.to(box, { y: 0, duration: 0.6, ease: 'power3.out', overwrite: true })
      return
    }
    const row = ol.children[active] as HTMLElement
    const detail = row.querySelector<HTMLElement>('.svc__detail-in')!
    const name = row.querySelector<HTMLElement>('.svc__name')!
    const listTop = ol.getBoundingClientRect().top - (Number(gsap.getProperty(box, 'y')) || 0)
    // altura final da linha aberta (o detalhe ainda está animando, então medimos o conteúdo)
    const bottom = listTop + row.offsetTop + name.offsetHeight + detail.scrollHeight + 70
    const shift = Math.max(0, bottom - (window.innerHeight - 24))
    gsap.to(box, { y: -shift, duration: 0.55, ease: 'power3.out', overwrite: true })
  }, [active])

  const enter = (i: number) => {
    if (!scrollDriven.current) setActive(i)
  }
  const leave = () => {
    if (!scrollDriven.current) setActive(-1)
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`not all and ${mq.reduce}`, () => {
        gsap.utils.toArray<HTMLElement>('.svc__row').forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: 'top 85%', once: true } })
            .from(row.querySelector('.svc__rule'), { scaleX: 0, duration: 1.4, ease: 'expo.inOut' }, 0)
            .from(row.querySelectorAll('.svc__name .w__i'), { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out' }, 0.25)
            .from(row.querySelector('.svc__idx'), { opacity: 0, duration: 0.6 }, 0.5)
        })
      })

      // Desktop: a seção trava e o scroll abre um serviço de cada vez (como o hover).
      // Uma linha fina embaixo do serviço aberto mostra quanto falta para o próximo.
      // computador E celular: a seção trava e o scroll abre um serviço de cada vez
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        root.current!.classList.add('is-driven')
        const bars = gsap.utils.toArray<HTMLElement>('.svc__progress')
        const n = services.length
        let current = -1
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.5 * n}`, // ~meia tela de rolagem por serviço
          pin: true,
          anticipatePin: 1,
          refreshPriority: 5, // depois da hero, antes das seções abaixo
          invalidateOnRefresh: true,
          onToggle: (self) => {
            scrollDriven.current = self.isActive
            if (self.isActive) setActive(Math.max(current, 0))
          },
          onLeaveBack: () => setActive(-1),
          onUpdate: (self) => {
            const x = self.progress * n
            const i = Math.min(n - 1, Math.floor(x))
            if (i !== current) {
              current = i
              setActive(i)
            }
            bars.forEach((b, k) => {
              b.style.transform = `scaleX(${Math.min(1, Math.max(0, x - k))})`
            })
          },
        })
        return () => {
          scrollDriven.current = false
          root.current?.classList.remove('is-driven')
          st.kill()
        }
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} id="servicos" className="svc" data-index="02" data-label="Serviços">
      <div ref={inner} className="svc__inner">
      <div className="svc__head">
        <h2 className="h-sec">O que fazemos</h2>
        <p className="svc__intro">Três frentes. O mesmo nível de acabamento em cada uma delas.</p>
      </div>

      <ol ref={list} className={`svc__list ${active >= 0 ? 'has-active' : ''}`} onMouseLeave={leave}>
        {services.map((s, i) => (
          <li
            key={s.name}
            className={`svc__row ${active === i ? 'is-active' : ''}`}
            onMouseEnter={() => enter(i)}
            onFocus={() => enter(i)}
            onBlur={leave}
            tabIndex={0}
            data-cursor="explore"
          >
            <span className="svc__rule" aria-hidden="true" />
            <span className="svc__progress" aria-hidden="true" />
            <span className="svc__idx tnum">0{i + 1}</span>
            <h3 className="svc__name">
              {s.name.split(' ').map((w, k) => (
                <Fragment key={k}>
                  <span className="w">
                    <span className="w__i">{w}</span>
                  </span>{' '}
                </Fragment>
              ))}
            </h3>
            <div className="svc__detail">
              <div className="svc__detail-in">
                <p>{s.desc}</p>
                <ul className="svc__tags">
                  {s.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
      </div>
    </section>
  )
}
