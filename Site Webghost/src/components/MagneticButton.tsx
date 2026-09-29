import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '../lib/scroll'
import { matches, mq } from '../lib/device'

type Props = {
  href: string
  /** abre em nova aba (links externos, como o WhatsApp) */
  external?: boolean
  children: ReactNode
  variant?: 'solid' | 'line'
  size?: 'md' | 'xl'
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Hover magnético (ui-ux-pro-max / gsap preset) com power3 no lugar do elastic:
 * elastic balança demais para a personalidade "silenciosa" da marca.
 */
export function MagneticButton({ href, external, children, variant = 'solid', size = 'md', onClick }: Props) {
  const el = useRef<HTMLAnchorElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const a = el.current!
    if (!matches(mq.finePointer) || matches(mq.reduce)) return
    const strength = size === 'xl' ? 0.22 : 0.3
    const xTo = gsap.quickTo(a, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(a, 'y', { duration: 0.6, ease: 'power3.out' })
    const lx = gsap.quickTo(label.current, 'x', { duration: 0.6, ease: 'power3.out' })
    const ly = gsap.quickTo(label.current, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = a.getBoundingClientRect()
      const dx = e.clientX - r.left - r.width / 2
      const dy = e.clientY - r.top - r.height / 2
      xTo(dx * strength); yTo(dy * strength)
      lx(dx * strength * 0.35); ly(dy * strength * 0.35)
    }
    const leave = () => { xTo(0); yTo(0); lx(0); ly(0) }
    a.addEventListener('pointermove', move)
    a.addEventListener('pointerleave', leave)
    return () => {
      a.removeEventListener('pointermove', move)
      a.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <a
      ref={el}
      href={href}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size}`}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="btn__fill" aria-hidden="true" />
      <span ref={label} className="btn__label">{children}</span>
    </a>
  )
}
