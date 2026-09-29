import { useRef } from 'react'
import { projects, WHATSAPP_URL, type Project } from '../data/content'
import { gsap, useGSAP } from '../lib/scroll'
import { matches, mq } from '../lib/device'
import { ProjectCover } from './ProjectCover'
import { MagneticButton } from '../components/MagneticButton'
import { openAllProjects } from '../components/AllProjects'

type Slot = { kind: 'project'; p: Project; i: number } | { kind: 'next' }

// todos os cards, cada um uma única vez: projetos + "o próximo"
const cycle: Slot[] = [...projects.map((p, i) => ({ kind: 'project' as const, p, i })), { kind: 'next' as const }]

// Sem repetição: duas faixas — a de cima leva a primeira metade, a de baixo o resto.
const ROW_COUNT = 2
const perRow = Math.ceil(cycle.length / ROW_COUNT)
const ROWS = Array.from({ length: ROW_COUNT }, (_, r) => cycle.slice(r * perRow, (r + 1) * perRow)).filter(
  (r) => r.length > 0,
)

// medidas em vw — iguais ao CSS (largura do card + espaço, recuo do plano inclinado)
const GEO = {
  desktop: { card: 40, gap: 1.6, planeLeft: -35, drift: 32 },
  mobile: { card: 74, gap: 3, planeLeft: -60, drift: 55 },
}
/**
 * Posição em que a faixa fica centralizada na tela e o quanto ela desliza.
 * O deslize é moderado (no máximo `drift` vw) — as faixas passam de lado
 * enquanto a página desce, sem travar a seção.
 */
function drift(count: number, g: (typeof GEO)['desktop']) {
  const width = count * g.card + (count - 1) * g.gap
  const center = (100 - width) / 2 - g.planeLeft
  const t = g.drift / 2
  return { from: center + t, to: center - t }
}

function Card({ slot }: { slot: Slot }) {
  if (slot.kind === 'next')
    return (
      <article className="pc pc--next">
        <p className="pc__next-title">
          O próximo
          <br />
          pode ser o seu.
        </p>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="pc__next-link ulink">
          Começar um projeto
        </a>
        <span className="pc__idx tnum">{String(cycle.length).padStart(2, '0')}</span>
      </article>
    )

  const { p, i } = slot
  return (
    <article className="pc" data-cursor="view">
      <div className="pc__media">
        <div className="prj__hover">
          {p.video ? (
            <video
              className="pc__img pc__video"
              poster={p.image}
              muted
              loop
              playsInline
              preload="auto"
              aria-label={`${p.name} — ${p.category}`}
            >
              {p.videoWebm && <source src={p.videoWebm} type="video/webm" />}
              <source src={p.video} type="video/mp4" />
            </video>
          ) : p.image ? (
            <img className="pc__img" src={p.image} alt={`${p.name} — ${p.category}`} decoding="async" draggable={false} />
          ) : (
            <ProjectCover kind={p.cover} />
          )}
        </div>
      </div>
      <div className="pc__info">
        <h3 className="pc__name">{p.name}</h3>
        <p className="pc__cat">{p.category}</p>
        <p className="pc__desc">{p.desc}</p>
      </div>
      <span className="pc__idx tnum">{String(i + 1).padStart(2, '0')}</span>
    </article>
  )
}

/**
 * Duas faixas inclinadas no mesmo plano diagonal.
 * No scroll, a de cima corre para a esquerda e a de baixo para a direita.
 */
export function Projects() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add({ desktop: mq.desktop, mobile: mq.mobile, reduce: mq.reduce }, (ctx) => {
        const { mobile, reduce } = ctx.conditions as { mobile: boolean; reduce: boolean }
        const g = mobile ? GEO.mobile : GEO.desktop
        const rows = gsap.utils.toArray<HTMLElement>('.prj__row')
        if (reduce) {
          rows.forEach((el, r) => {
            const d = drift(ROWS[r].length, g)
            gsap.set(el, { x: `${(d.from + d.to) / 2}vw` })
          })
          return
        }
        // sem travar: as faixas deslizam enquanto a seção atravessa a tela,
        // alternando o sentido (esquerda, direita, esquerda...)
        const st = { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        rows.forEach((el, r) => {
          const d = drift(ROWS[r].length, g)
          const [from, to] = r % 2 === 0 ? [d.from, d.to] : [d.to, d.from]
          gsap.fromTo(el, { x: `${from}vw` }, { x: `${to}vw`, ease: 'none', scrollTrigger: st })
        })
        // o plano endireita levemente enquanto atravessa a tela
        gsap.fromTo(
          '.prj__plane',
          { rotateZ: mobile ? -9 : -11, rotateX: mobile ? 10 : 20 },
          { rotateZ: mobile ? -5 : -6, rotateX: mobile ? 4 : 8, ease: 'none', scrollTrigger: st },
        )
      })

      // vídeos dos cards: tocam só enquanto estão na tela
      const videos = gsap.utils.toArray<HTMLVideoElement>('.pc__video')
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            const v = e.target as HTMLVideoElement
            if (e.isIntersecting && !matches(mq.reduce)) v.play().catch(() => {})
            else v.pause()
          }),
        { threshold: 0.15 },
      )
      videos.forEach((v) => io.observe(v))

      // hover: a capa acompanha o cursor com leve zoom
      mm.add(mq.finePointer, () => {
        const offs: (() => void)[] = []
        gsap.utils.toArray<HTMLElement>('.pc__media').forEach((m) => {
          const img = m.querySelector('.prj__hover')!
          const xTo = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3.out' })
          const yTo = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3.out' })
          const move = (e: PointerEvent) => {
            const r = m.getBoundingClientRect()
            xTo(((e.clientX - r.left) / r.width - 0.5) * -18)
            yTo(((e.clientY - r.top) / r.height - 0.5) * -12)
          }
          const enter = () => gsap.to(img, { scale: 1.05, duration: 0.9, ease: 'power3.out' })
          const leave = () => {
            xTo(0); yTo(0)
            gsap.to(img, { scale: 1, duration: 0.9, ease: 'power3.out' })
          }
          m.addEventListener('pointermove', move)
          m.addEventListener('pointerenter', enter)
          m.addEventListener('pointerleave', leave)
          offs.push(() => {
            m.removeEventListener('pointermove', move)
            m.removeEventListener('pointerenter', enter)
            m.removeEventListener('pointerleave', leave)
          })
        })
        return () => offs.forEach((f) => f())
      })

      return () => {
        io.disconnect()
        mm.revert()
      }
    },
    { scope: root },
  )


  return (
    <section ref={root} id="projetos" className="prj" data-index="03" data-label="Projetos">
      <div className="prj__head">
        <h2 className="h-sec">Projetos selecionados</h2>
        <span className="prj__rule" aria-hidden="true" />
        <p className="micro tnum">{String(projects.length).padStart(2, '0')} projetos</p>
      </div>

      <div className="prj__stage">
        <div className="prj__plane">
          {ROWS.map((r, k) => (
            <div className="prj__row" key={k}>
              {r.map((slot, j) => (
                <Card slot={slot} key={j} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="prj__more">
        <MagneticButton
          href="#todos-os-projetos"
          variant="line"
          onClick={(e) => {
            e.preventDefault()
            openAllProjects()
          }}
        >
          Ver todos os projetos
        </MagneticButton>
      </div>
    </section>
  )
}
