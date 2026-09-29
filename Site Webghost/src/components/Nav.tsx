import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { nav, WHATSAPP_URL } from '../data/content'
import { GhostMark } from './GhostMark'
import { ScrollTrigger, getLenis } from '../lib/scroll'
import { transitionTo } from './PageTransition'

/** Todo link interno passa pela transição de véu. */
export const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const href = e.currentTarget.getAttribute('href')
  if (href?.startsWith('#')) {
    e.preventDefault()
    transitionTo(href)
  }
}

export function Nav({ ready }: { ready: boolean }) {
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        setSolid(y > 40)
        setHidden(y > window.innerHeight * 0.8 && self.direction === 1)
      },
    })
    return () => st.kill()
  }, [])

  useEffect(() => {
    const l = getLenis()
    if (open) l?.stop()
    else if (ready) l?.start()
  }, [open, ready])

  const click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false)
    go(e)
  }

  return (
    <>
      <header className={`nav ${solid ? 'is-solid' : ''} ${hidden && !open ? 'is-hidden' : ''} ${ready ? 'is-ready' : ''}`}>
        <a href="#top" onClick={click} className="nav__logo" aria-label="WebGhost — início">
          <GhostMark className="nav__ghost" />
          <span className="nav__name">WebGhost</span>
        </a>
        <nav className="nav__links" aria-label="Principal">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={click} className="ulink">{n.label}</a>
          ))}
        </nav>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="nav__cta">Começar um projeto</a>
        <button className="nav__toggle" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fechar' : 'Menu'}
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu"
            className="menu"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Menu">
              {[...nav].map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  onClick={click}
                  className="menu__link"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.45, ease: 'easeOut' }}
                >
                  <span className="menu__idx">0{i + 1}</span>
                  {n.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
