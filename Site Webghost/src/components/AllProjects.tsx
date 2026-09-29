import { useEffect, useRef, useState } from 'react'
import { projects, WHATSAPP_URL, type Project } from '../data/content'
import { gsap, getLenis } from '../lib/scroll'
import { matches, mq } from '../lib/device'
import { onProjectsIndex, setProjectsIndex } from '../lib/projectsIndex'
import { transitionAction } from './PageTransition'
import { ProjectCover } from '../sections/ProjectCover'
import { GhostMark } from './GhostMark'

/** Abre "Todos os projetos" com o véu (use nos botões "Ver todos"). */
export const openAllProjects = () => transitionAction('Todos os projetos', () => setProjectsIndex(true))
const closeAllProjects = () => transitionAction('Projetos', () => setProjectsIndex(false))

const pad = (n: number) => String(n).padStart(2, '0')

/** Mídia do projeto: vídeo, imagem ou capa provisória. */
function Media({ p, className }: { p: Project; className: string }) {
  if (p.video)
    return (
      <video className={className} poster={p.image} muted loop playsInline preload="none" aria-label={p.name}>
        {p.videoWebm && <source src={p.videoWebm} type="video/webm" />}
        <source src={p.video} type="video/mp4" />
      </video>
    )
  if (p.image) return <img className={className} src={p.image} alt={`${p.name} — ${p.category}`} decoding="async" />
  return (
    <div className="ap__cover">
      <ProjectCover kind={p.cover} />
    </div>
  )
}

/**
 * "Todos os projetos": galeria sobreposta ao site. Cada card é clicável e abre o
 * projeto completo (a página inteira do site, para rolar). Tudo troca por baixo do véu.
 * Esc: no projeto volta para a galeria; na galeria fecha.
 */
export function AllProjects() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const galleryScroll = useRef(0)
  const activeRef = useRef<number | null>(null)

  useEffect(() => onProjectsIndex(setOpen), [])

  // abrir um projeto / voltar para a galeria — sempre por baixo do véu
  const openProject = (i: number) =>
    transitionAction(projects[i].name, () => {
      // guarda a posição só quando sai da galeria (de um projeto para o próximo, mantém a da galeria)
      if (activeRef.current === null) galleryScroll.current = root.current?.scrollTop ?? 0
      setActive(i)
    })
  const backToGallery = () => transitionAction('Todos os projetos', () => setActive(null))

  // abrir/fechar a galeria
  useEffect(() => {
    const html = document.documentElement
    const lenis = getLenis()
    const el = root.current
    if (!el) return
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement
      html.classList.add('is-modal')
      lenis?.stop()
      el.scrollTop = 0
      closeBtn.current?.focus({ preventScroll: true })
      return
    }
    setActive(null)
    html.classList.remove('is-modal')
    lenis?.start()
    returnFocus.current?.focus?.({ preventScroll: true })
  }, [open])

  // a cada troca de tela (galeria ↔ projeto): posição, entrada, vídeos e Esc
  useEffect(() => {
    const el = root.current
    if (!el || !open) return
    el.scrollTop = active === null ? galleryScroll.current : 0
    const reduce = matches(mq.reduce)
    if (!reduce) {
      const targets = active === null ? el.querySelectorAll('.ap__item') : el.querySelectorAll('.pd__aside > *, .pd__frame')
      gsap.fromTo(targets, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', delay: 1.1 })
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement
          if (e.isIntersecting && !reduce) v.play().catch(() => {})
          else v.pause()
        }),
      { root: el, threshold: 0.2 },
    )
    el.querySelectorAll('video').forEach((v) => io.observe(v))
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (active !== null) backToGallery()
      else closeAllProjects()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active])

  activeRef.current = active
  const p = active !== null ? projects[active] : null
  const nextIdx = active !== null ? (active + 1) % projects.length : 0

  return (
    <div
      ref={root}
      className={`ap ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={p ? p.name : 'Todos os projetos'}
      aria-hidden={!open}
      inert={!open || undefined}
      data-lenis-prevent
    >
      <header className="ap__bar">
        <div className="ap__brand">
          <GhostMark className="ap__ghost" />
          <span>WebGhost</span>
        </div>
        <div className="ap__actions">
          {p && (
            <button className="ap__close" onClick={backToGallery}>
              ← Todos os projetos
            </button>
          )}
          <button ref={closeBtn} className="ap__close" onClick={closeAllProjects}>
            Fechar
          </button>
        </div>
      </header>

      {p ? (
        // ——— projeto completo ———
        <article className="pd">
          <aside className="pd__aside">
            <span className="micro tnum pd__idx">
              {pad(active! + 1)} / {pad(projects.length)}
            </span>
            <h2 className="pd__name">{p.name}</h2>
            <p className="pd__cat">
              {p.category} <span className="tnum">({p.year})</span>
            </p>
            <p className="pd__desc">{p.desc}</p>
            <div className="pd__nav">
              <button className="btn btn--line btn--md" onClick={() => openProject(nextIdx)}>
                <span className="btn__fill" aria-hidden="true" />
                <span className="btn__label">Próximo: {projects[nextIdx].name} →</span>
              </button>
              <button className="ulink pd__back" onClick={backToGallery}>
                Voltar aos projetos
              </button>
            </div>
          </aside>

          <div className="pd__frame">
            {p.page ? (
              <img className="pd__page" src={p.page} alt={`Página completa do site ${p.name}`} decoding="async" />
            ) : (
              <>
                <div className="pd__media">
                  <Media p={p} className="ap__img" />
                </div>
                <p className="micro pd__soon">A página completa deste projeto entra em breve.</p>
              </>
            )}
          </div>
        </article>
      ) : (
        // ——— galeria ———
        <>
          <div className="ap__head">
            <h2 className="ap__title">Todos os projetos</h2>
            <p className="micro tnum ap__count">{pad(projects.length)} projetos</p>
          </div>

          <ol className="ap__grid">
            {projects.map((proj, i) => (
              <li className="ap__item" key={proj.name}>
                <button
                  className="ap__card"
                  onClick={() => openProject(i)}
                  aria-label={`Abrir o projeto ${proj.name}`}
                  data-cursor="view"
                >
                  <div className="ap__media">
                    <Media p={proj} className="ap__img" />
                  </div>
                  <div className="ap__info">
                    <span className="ap__idx tnum">{pad(i + 1)}</span>
                    <h3 className="ap__name">{proj.name}</h3>
                    <p className="ap__cat">
                      {proj.category} <span className="tnum">({proj.year})</span>
                    </p>
                    <p className="ap__desc">{proj.desc}</p>
                  </div>
                </button>
              </li>
            ))}
          </ol>

          <footer className="ap__foot">
            <p className="ap__foot-title">O próximo pode ser o seu.</p>
            <a className="btn btn--solid btn--md" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <span className="btn__fill" aria-hidden="true" />
              <span className="btn__label">Começar um projeto</span>
            </a>
          </footer>
        </>
      )}
    </div>
  )
}
