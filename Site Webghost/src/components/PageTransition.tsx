import { useEffect, useRef, useState } from 'react'
import { gsap, getLenis, scrollToTarget, ScrollTrigger } from '../lib/scroll'
import { matches, mq } from '../lib/device'
import { nav } from '../data/content'
import { GhostMark } from './GhostMark'
import { forceLoaded, onLoadProgress } from '../lib/load'

/**
 * Transição entre seções: um véu escuro se forma por ruído e cobre a tela,
 * o site pula para o destino por baixo e o véu se rasga do centro para fora.
 * A borda do rasgo tem um fio de luz branca quente — a mesma luz do triângulo.
 * Adaptado do NoiseDissolveReveal (WebGL2), sem Tailwind/shadcn.
 */

// curva do rasgo: nucleação lenta, depois as ilhas se unem e disparam
const tearEase = (t: number) => {
  const p = Math.min(1, Math.max(0, t))
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 2.4) / 2
}

const VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() { v_uv = (a_position + 1.0) * 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec3 u_edge;
uniform float u_progress;
uniform float u_scale;
uniform float u_soft;
uniform float u_bias;
uniform float u_seed;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21) + u_seed); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0; float a = 0.5; float n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); n += a; p *= 2.03; a *= 0.5; }
  return s / n;
}
void main() {
  float m = min(u_resolution.x, u_resolution.y);
  vec2 p = (v_uv * u_resolution) / m;
  float n = smoothstep(0.28, 0.72, fbm(p * u_scale));
  vec2 d2 = (v_uv - 0.5) * vec2(max(u_resolution.x / max(u_resolution.y, 1.0), 1.0), max(u_resolution.y / max(u_resolution.x, 1.0), 1.0));
  float d = clamp(length(d2) * 1.41421, 0.0, 1.0);
  float t = mix(-u_soft - 0.02, 1.0 + u_soft + 0.02, u_progress);
  float thr = t * (1.0 + u_bias) - u_bias * d;
  float alpha = smoothstep(thr - u_soft, thr + u_soft, n);
  // fio de luz na borda do rasgo (só enquanto o véu está se movendo)
  // largura medida em pixels de tela (fwidth): o fio fica fino mesmo onde o ruído é plano
  float w = max(fwidth(n) * 1.4, 0.0015);
  float band = 1.0 - smoothstep(0.0, w, abs(n - thr));
  band *= smoothstep(0.0, 0.04, u_progress) * (1.0 - smoothstep(0.96, 1.0, u_progress));
  vec3 col = mix(u_color, u_edge, band);
  fragColor = vec4(col, clamp(max(alpha, band * 0.9), 0.0, 1.0));
}`

/**
 * Anima 0 → 1 com um relógio próprio que nunca pula tempo: se um quadro demorar,
 * a animação só desacelera naquele quadro em vez de dar um salto (≠ GSAP com lagSmoothing 0).
 */
function animateSmooth(duration: number, onUpdate: (u: number) => void, onDone?: () => void) {
  let u = 0
  let last = performance.now()
  let raf = 0
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 20)
    last = now
    u = Math.min(1, u + dt / duration)
    onUpdate(u)
    if (u < 1) raf = requestAnimationFrame(tick)
    else onDone?.()
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

/**
 * Tempos da transição (s) — o preloader usa exatamente os mesmos:
 *   cobrir 0,82 → nome entra → pausa → nome sai → rasgo 1,22   (total 2,86 s)
 */
const T = {
  cover: 0.82, // véu fecha (transição) = contagem 000→100 (preloader)
  labelIn: 0.3,
  hold: 0.2,
  gap: 0.12,
  labelOut: 0.3,
  tear: 1.22,
}
/** instantes absolutos, iguais para as duas animações */
const AT = (() => {
  const labelInStart = T.cover - 0.1
  const swap = labelInStart + T.labelIn + T.hold // o site troca por baixo do véu
  const labelOutStart = swap + T.gap
  const tearStart = labelOutStart + T.labelOut
  return { labelInStart, swap, labelOutStart, tearStart, end: tearStart + T.tear }
})()

type Runner = (label: string, swap: () => void) => void
let runner: Runner | null = null
const jumpTo = (target: string) => {
  const lenis = getLenis()
  const y = target === '#top' ? 0 : target
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else if (typeof y === 'number') window.scrollTo(0, y)
  else document.querySelector(y)?.scrollIntoView()
  ScrollTrigger.update()
}

/** Navega para uma seção com a transição (ou com scroll suave, se indisponível). */
export function transitionTo(target: string) {
  if (runner) runner(labelFor(target), () => jumpTo(target))
  else scrollToTarget(target === '#top' ? 0 : target)
}

/** Executa `swap` com a tela coberta pelo véu (ex.: abrir/fechar a página de projetos). */
export function transitionAction(label: string, swap: () => void) {
  if (runner) runner(label, swap)
  else swap()
}

const labelFor = (target: string) =>
  target === '#top' ? 'Início' : nav.find((n) => n.href === target)?.label ?? ''

/** O véu roda aqui? (WebGL2 e sem "reduzir movimento") — decide antes do primeiro paint. */
export function veilSupported() {
  if (typeof window === 'undefined' || matches(mq.reduce)) return false
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

type Props = {
  /** true: o véu também é a tela de carregamento */
  boot?: boolean
  /** chamado quando o carregamento termina e o véu começa a abrir */
  onBootDone?: () => void
}

export function PageTransition({ boot = false, onBootDone }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState(boot ? '000' : '')
  const bootDone = useRef(onBootDone)
  bootDone.current = onBootDone

  useEffect(() => {
    const release = () => {
      // sem véu disponível: nunca deixa o site preso atrás da cobertura de carregamento
      root.current?.classList.remove('is-active', 'is-boot')
      if (boot) bootDone.current?.()
    }
    if (matches(mq.reduce)) return release() // sem véu: o link faz scroll suave normal
    const cv = canvas.current!
    const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false })
    if (!gl) return release()

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) return release()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return release()

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const loc = {
      res: u('u_resolution'), color: u('u_color'), edge: u('u_edge'), progress: u('u_progress'),
      scale: u('u_scale'), soft: u('u_soft'), bias: u('u_bias'), seed: u('u_seed'),
    }
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const mobile = matches(mq.mobile)
    // o shader de ruído roda em cada pixel: limita a ~1,6 milhão de pixels
    // (em telas grandes/retina a diferença não aparece, mas o custo cai pela metade ou mais)
    const PIXEL_BUDGET = 1.6e6
    let seed = 0

    const draw = (progress: number) => {
      const base = Math.min(window.devicePixelRatio || 1, 1.5)
      const area = window.innerWidth * window.innerHeight * base * base
      const dpr = area > PIXEL_BUDGET ? base * Math.sqrt(PIXEL_BUDGET / area) : base
      const w = Math.max(1, Math.round(window.innerWidth * dpr))
      const h = Math.max(1, Math.round(window.innerHeight * dpr))
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
      gl.viewport(0, 0, w, h)
      gl.useProgram(prog)
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.enableVertexAttribArray(pos)
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(loc.res, w, h)
      gl.uniform3f(loc.color, 5 / 255, 5 / 255, 5 / 255) // #050505, o fundo do site
      gl.uniform3f(loc.edge, 242 / 255, 240 / 255, 236 / 255) // branco quente da luz
      gl.uniform1f(loc.progress, progress)
      gl.uniform1f(loc.scale, mobile ? 4.5 : 6)
      gl.uniform1f(loc.soft, 0.012)
      gl.uniform1f(loc.bias, 0.2)
      gl.uniform1f(loc.seed, seed)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    if (import.meta.env.DEV)
      (window as unknown as { __pt: unknown }).__pt = { draw, show: (v: boolean) => root.current!.classList.toggle('is-active', v) }

    let busy = false
    runner = (label, swap) => {
      if (busy) return
      busy = true
      seed = Math.random() * 100
      const el = root.current!
      const st = { t: 0 }
      setLabel(label)
      el.classList.add('is-active')

      gsap
        .timeline({
          onComplete: () => {
            el.classList.remove('is-active')
            gl.clear(gl.COLOR_BUFFER_BIT)
            busy = false
          },
        })
        // 1. o véu se fecha: as manchas crescem e cobrem a tela (centro por último)
        .to(st, { t: 1, duration: T.cover, ease: 'none', onUpdate: () => draw(1 - tearEase(st.t)) }, 0)
        .fromTo('.pt__label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: T.labelIn, ease: 'power2.out' }, AT.labelInStart)
        // 2. coberto: a troca acontece por baixo do véu (pular de seção, abrir uma página...)
        .add(swap, AT.swap)
        .to('.pt__label', { opacity: 0, y: -10, duration: T.labelOut, ease: 'power2.in' }, AT.labelOutStart)
        // 3. o véu se rasga do centro para fora, revelando a seção
        .set(st, { t: 0 }, AT.tearStart)
        .to(st, { t: 1, duration: T.tear, ease: 'none', onUpdate: () => draw(tearEase(st.t)) }, AT.tearStart)
    }

    // ——— carregamento: o véu nasce fechado, rasga um pouco conforme carrega e abre no 100 ———
    // Tudo aqui roda no relógio suave (animateSmooth / loop com dt limitado): sem saltos.
    let offLoad: (() => void) | undefined
    let stopLoop = () => {}
    let stopTear = () => {}
    let safety = 0
    if (boot) {
      busy = true
      seed = Math.random() * 100
      const el = root.current!
      const num = el.querySelector<HTMLSpanElement>('.pt__label span')!
      const PRE = 0.13 // quanto o véu se rasga durante o carregamento (o resto abre no final)
      let target = 0
      let disp = 0
      let finished = false
      draw(0)
      el.classList.remove('is-boot') // o canvas já cobre: tira o fundo de segurança
      gsap.fromTo('.pt__label', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: T.labelIn, ease: 'power2.out' })

      // Mesmo roteiro da transição, no relógio suave (dt limitado, nunca pula):
      //   0 → 0,82 s  contagem 000→100 (= o véu fechando na transição)
      //   +0,40 s     libera o site por baixo do véu   (= a troca de seção)
      //   +0,52 s     o nome sai em 0,30 s
      //   +0,82 s     rasgo de 1,22 s                   → total 2,86 s, igual à transição
      // Se o carregamento real demorar mais que 0,82 s, a contagem espera por ele.
      let t = 0 // tempo do roteiro
      let doneAt = -1 // instante em que chegou a 100
      let released = false
      let labelGone = false
      let tearing = false
      let last = performance.now()
      let raf = 0
      const outEase = (u: number) => 1 - (1 - u) * (1 - u)

      const loop = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 20)
        last = now
        t += dt

        if (doneAt < 0) {
          // contagem: o que vier primeiro — o tempo do roteiro ou o carregamento real
          const byTime = outEase(Math.min(1, t / T.cover))
          if (target >= byTime) {
            disp = Math.max(disp, byTime) // carregou a tempo: segue o roteiro exato
          } else {
            // carregamento mais lento: persegue o progresso real, sem saltos nem arrasto no fim
            const step = (target - disp) * (1 - Math.exp(-6 * dt))
            disp = Math.min(target, disp + Math.max(step, target >= 1 ? 0.9 * dt : 0))
          }
          if (disp > 0.999) disp = 1
          draw(PRE * disp)
          num.textContent = String(Math.round(disp * 100)).padStart(3, '0')
          if (disp >= 1) doneAt = t
        } else {
          const since = t - doneAt + T.cover // mesmo relógio absoluto da transição
          if (!released && since >= AT.swap) {
            released = true
            finished = true
            offLoad?.()
            bootDone.current?.()
          }
          if (!labelGone && since >= AT.labelOutStart) {
            labelGone = true
            gsap.to('.pt__label', { opacity: 0, y: -10, duration: T.labelOut, ease: 'power2.in' })
          }
          if (!tearing && since >= AT.tearStart) {
            tearing = true
            stopTear = animateSmooth(
              T.tear,
              (u) => draw(PRE + (1 - PRE) * tearEase(u)),
              () => {
                el.classList.remove('is-active')
                gl.clear(gl.COLOR_BUFFER_BIT)
                busy = false
                setLabel('')
              },
            )
            return // daqui em diante quem desenha é o rasgo
          }
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      stopLoop = () => cancelAnimationFrame(raf)

      offLoad = onLoadProgress((v) => {
        if (!finished) target = Math.max(target, v)
      })
      safety = window.setTimeout(forceLoaded, 5000)
    }

    return () => {
      offLoad?.()
      stopLoop()
      stopTear()
      clearTimeout(safety)
      runner = null
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [boot])

  return (
    <div
      ref={root}
      className={boot ? 'pt is-active is-boot' : 'pt'}
      role={boot ? 'status' : undefined}
      aria-label={boot ? 'Carregando' : undefined}
      aria-hidden={boot ? undefined : true}
    >
      <canvas ref={canvas} />
      <div className="pt__label">
        <GhostMark className="pt__ghost" />
        <span className="tnum">{label}</span>
      </div>
    </div>
  )
}
