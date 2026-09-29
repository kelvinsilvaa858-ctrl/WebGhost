import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { rig } from './rig'

gsap.registerPlugin(ScrollTrigger, useGSAP)
if (import.meta.env.DEV) (window as unknown as { __ST: typeof ScrollTrigger }).__ST = ScrollTrigger

let lenis: Lenis | null = null

export function initSmoothScroll(reduced: boolean) {
  if (reduced || lenis) return lenis
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4 })
  lenis.on('scroll', (e: Lenis) => {
    rig.velocity = e.velocity
    ScrollTrigger.update()
  })
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  lenis.stop() // liberado quando o loader termina
  if (import.meta.env.DEV) (window as unknown as { __lenis: Lenis }).__lenis = lenis
  return lenis
}

export const getLenis = () => lenis

export function scrollToTarget(target: string | number, duration = 1.6) {
  if (lenis) lenis.scrollTo(target, { duration })
  else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  else window.scrollTo({ top: target, behavior: 'smooth' })
}

export { gsap, ScrollTrigger, useGSAP }
