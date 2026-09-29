import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { forceLoaded, onLoadProgress } from '../lib/load'

/** Tela de carregamento curta: o número reflete o carregamento real. */
export function Loader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const num = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const state = { v: 0 }
    let finished = false
    const render = () => {
      bar.current!.style.transform = `scaleX(${state.v})`
      num.current!.textContent = String(Math.round(state.v * 100)).padStart(3, '0')
    }
    const finish = () => {
      if (finished) return
      finished = true
      const hide = () => {
        root.current!.style.display = 'none'
      }
      gsap
        .timeline()
        .to('.loader__inner', { yPercent: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.15)
        .add(() => {
          // alternativa sem WebGL2 / com movimento reduzido: cortina que sobe
          gsap
            .timeline({ onComplete: hide })
            .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' })
            .add(() => onDone(), 0.4)
        })
    }
    const off = onLoadProgress((v) => {
      gsap.to(state, {
        v,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: render,
        onComplete: () => v >= 1 && finish(),
      })
    })
    const safety = window.setTimeout(forceLoaded, 5000)
    return () => {
      off()
      clearTimeout(safety)
    }
  }, [onDone])

  return (
    <div ref={root} className="loader" role="status" aria-label="Carregando">
      <div className="loader__inner">
        <span className="loader__word">WebGhost</span>
        <span className="loader__track"><span ref={bar} className="loader__bar" /></span>
        <span ref={num} className="loader__num">000</span>
      </div>
    </div>
  )
}
