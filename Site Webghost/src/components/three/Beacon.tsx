import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, MeshBasicMaterial, MathUtils, Points, Vector4 } from 'three'
import { rig, onRigWake } from '../../lib/rig'
import { triangleFrame, triangleSolid } from './geometry'
import { floorMaterial } from './floor'
import { sandGeometry, sandMaterial, skyMaterial, TRAIL, TRAIL_LIFE } from './sky'
import { CAM_Z, HERO_Z, TAN_HALF, emptyPose, heroPose, sectionPose, type Pose } from './poses'

const damp = MathUtils.damp
const px_ratio = (state: { gl: { getPixelRatio: () => number } }) => state.gl.getPixelRatio()
const KEYS: (keyof Pose)[] = ['fx', 'fy', 'z', 'scale', 'rx', 'ry', 'rz', 'ix', 'iy', 'iz', 'spread', 'core', 'gain']
const TWO_PI = Math.PI * 2

const OUTER = 1.35 // raio circunscrito da moldura
const GLOW = 1.9
const FLOOR_Y = -1.6 // altura do chão (a faixa de luz cai logo abaixo dos botões) // intensidade emissiva (acima de 1 = entra no bloom)

/**
 * Peça luminosa: moldura triangular vazada com um núcleo invertido no vão.
 * Vive só na hero; depois da travessia some e o render para.
 */
export function Beacon({ mobile }: { mobile: boolean }) {
  const root = useRef<Group>(null!)
  const spinner = useRef<Group>(null!)
  const core = useRef<Mesh>(null!)
  const floor = useRef<Mesh>(null!)
  const sky = useRef<Mesh>(null!)
  const sand = useRef<Points>(null!)
  // rastro do cursor sobre o céu (xy no espaço do céu, idade, força)
  const trail = useRef<Vector4[]>(Array.from({ length: TRAIL }, () => new Vector4(0, 0, 99, 0)))
  const lastP = useRef({ x: 0, y: 0, set: false })
  const { setFrameloop, viewport, camera, scene, gl } = useThree()

  const geo = useMemo(
    () => ({
      frame: triangleFrame(OUTER, 0.74, 0.34),
      sand: sandGeometry(mobile ? 3500 : 9000),
      core: triangleSolid(0.2, 0.16),
    }),
    [],
  )

  const mats = useMemo(() => {
    // cor acima de 1 = entra no bloom; material básico: a peça emite luz, mas não é iluminada pelas luzes da cena
    const glow = new MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true, fog: false })
    const coreMat = new MeshBasicMaterial({ color: '#f4f1ea', toneMapped: false, transparent: true, fog: false })
    return { glow, coreMat, floor: floorMaterial(), sky: skyMaterial(mobile ? 4 : 6), sand: sandMaterial(mobile ? 4 : 6) }
  }, [])

  const cur = useRef<Pose>({ ...emptyPose(), opacity: 0 })
  const target = useRef<Pose>(emptyPose())
  const spin = useRef(0)
  const mouse = useRef({ x: 0, y: 0 })
  const vel = useRef(0)
  const dragRot = useRef({ x: 0, y: 0 })
  const dragVel = useRef({ x: 0, y: 0 })
  const lastPose = useRef('')

  useEffect(() => onRigWake(() => setFrameloop('always')), [setFrameloop])

  // ao soltar: leva o ângulo para o intervalo -180°…180° — a volta é sempre pelo caminho mais curto
  useEffect(() => {
    const wrap = (a: number) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2))
    const onRelease = () => {
      dragRot.current.x = wrap(dragRot.current.x)
      dragRot.current.y = wrap(dragRot.current.y)
    }
    window.addEventListener('wg:drag-release', onRelease)
    return () => window.removeEventListener('wg:drag-release', onRelease)
  }, [])
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(mats).forEach((m) => m.dispose())
    },
    [geo, mats],
  )

  // compila os shaders da peça logo na criação da cena (com ela visível por um instante),
  // em vez de na primeira vez que ela aparece — evita o engasgo no fim do carregamento
  useLayoutEffect(() => {
    const r = root.current
    const f = floor.current
    const k = sky.current
    const sd = sand.current
    r.visible = f.visible = k.visible = sd.visible = true
    gl.compile(scene, camera)
    r.visible = f.visible = k.visible = sd.visible = false
  }, [gl, scene, camera])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = state.clock.elapsedTime
    const c = cur.current
    const reduced = rig.reduced

    mouse.current.x = damp(mouse.current.x, reduced ? 0 : rig.pointer.x, 3, dt)
    mouse.current.y = damp(mouse.current.y, reduced ? 0 : rig.pointer.y, 3, dt)
    const m = mouse.current

    // arraste: enquanto segura, a peça segue a mão; ao soltar, uma mola traz de volta de frente
    const dr = dragRot.current
    const dv = dragVel.current
    if (rig.drag.active && rig.mode === 'hero') {
      const nx = damp(dr.x, rig.drag.x, 18, dt)
      const ny = damp(dr.y, rig.drag.y, 18, dt)
      dv.x = (nx - dr.x) / Math.max(dt, 1e-4)
      dv.y = (ny - dr.y) / Math.max(dt, 1e-4)
      dr.x = nx
      dr.y = ny
    } else {
      // mola levemente sub-amortecida: volta com um pequeno balanço, como um objeto com peso
      const k = 38, damping = 8.5
      dv.x += (-k * dr.x - damping * dv.x) * dt
      dv.y += (-k * dr.y - damping * dv.y) * dt
      dr.x += dv.x * dt
      dr.y += dv.y * dt
    }
    // inércia do scroll: rolar rápido dá um "empurrão" na peça
    vel.current = damp(vel.current, reduced ? 0 : Math.max(-60, Math.min(60, rig.velocity)), 4, dt)
    rig.velocity *= 0.9

    let tg: Pose
    if (rig.mode === 'hero') {
      tg = heroPose(rig.heroP, reduced ? 0 : t, mobile, target.current)
      for (const k of KEYS) c[k] = damp(c[k], tg[k], 14, dt)
      c.opacity = damp(c.opacity, tg.opacity * rig.intro, 10, dt)
      spin.current = damp(spin.current, Math.round(spin.current / TWO_PI) * TWO_PI, 4, dt)
    } else {
      tg = sectionPose()
      // cada aparição começa do fundo da cena, já na pose da seção (nunca atravessando a tela)
      const appearing = tg.opacity > 0 && c.opacity < 0.02 && lastPose.current !== rig.pose
      if (rig.teleport || appearing) {
        Object.assign(c, tg, { z: tg.z - 12, opacity: 0 })
        rig.teleport = false
      }
      lastPose.current = rig.pose
      if (tg.opacity > 0) {
        for (const k of KEYS) c[k] = damp(c[k], tg[k], 4, dt)
        if (tg.spin > 0) spin.current += dt * tg.spin * (reduced ? 0 : 1)
        else spin.current = damp(spin.current, Math.round(spin.current / TWO_PI) * TWO_PI, 2.5, dt)
      }
      c.opacity = damp(c.opacity, tg.opacity, tg.opacity > 0 ? 2.2 : 5, dt)
      if (tg.opacity === 0 && c.opacity < 0.004) {
        // nada visível: desenha um quadro vazio e para o loop
        c.opacity = 0
        root.current.visible = false
        floor.current.visible = false
        sky.current.visible = false
        sand.current.visible = false
        state.gl.render(scene, camera)
        setFrameloop('never')
        return
      }
    }
    root.current.visible = c.opacity > 0.004

    const halfH = Math.max(0.001, (CAM_Z - c.z) * TAN_HALF)
    const halfW = halfH * (viewport.aspect || 1)
    const g = c.gain

    // a peça responde ao cursor como um objeto com peso: gira, desliza, inclina pouco
    root.current.position.set(c.fx * halfW + m.x * 0.1 * g, c.fy * halfH + m.y * 0.05 * g, c.z)
    root.current.rotation.set(c.rx - m.y * 0.07 * g + vel.current * 0.004 + dr.x, c.ry + m.x * 0.3 * g + dr.y, c.rz)
    root.current.scale.setScalar(c.scale * (0.9 + 0.1 * rig.intro))

    if (rig.mode === 'section') spin.current += vel.current * dt * 0.05
    spinner.current.rotation.set(0, spin.current + (1 - rig.intro) * -0.9, 0)
    core.current.position.z = c.spread * 0.9
    core.current.rotation.set(c.ix, c.iy, c.iz)
    core.current.position.y = -0.04 + Math.sin(t * 0.8) * 0.035 * (reduced ? 0 : 1) // flutua no vão
    core.current.scale.setScalar(Math.max(0.0001, c.core))

    // o brilho respira de leve e acompanha a proximidade do cursor
    const near = 1 - Math.min(1, Math.hypot(m.x - c.fx, m.y - c.fy) * 0.6)
    const o = c.opacity
    const pulse = 1 + Math.sin(t * 1.3) * 0.04 * (reduced ? 0 : 1) + near * 0.12 * g
    mats.glow.color.setScalar(GLOW * pulse)
    mats.glow.opacity = o
    mats.coreMat.color.setRGB(0.957 * GLOW * 0.7 * pulse, 0.945 * GLOW * 0.7 * pulse, 0.918 * GLOW * 0.7 * pulse)
    mats.coreMat.opacity = o

    // chão: só na hero; avança junto com a travessia e recebe a luz da peça
    const fl = floor.current
    fl.visible = rig.mode === 'hero' && root.current.visible
    if (fl.visible) {
      // o chão não recua junto com a peça: só acompanha a travessia
      fl.position.z = c.z - (mobile ? HERO_Z.mobile : HERO_Z.desktop)
      const u = mats.floor.uniforms
      u.uOpacity.value = o * (1 - Math.min(1, rig.heroP * 3)) // some antes da câmera entrar no vão
      u.uGlow.value = pulse
      u.uTri.value.set(root.current.position.x, 0)
    }

    // céu: tela cheia atrás de tudo, some junto com o chão no começo da travessia
    const sk = sky.current
    sk.visible = fl.visible
    if (sk.visible) {
      const u = mats.sky.uniforms
      const px = state.gl.getPixelRatio()
      u.uRes.value.set(state.size.width * px, state.size.height * px)
      u.uDot.value = Math.max(1.5, 2 * px)
      u.uTime.value = reduced ? 0 : t
      u.uMouse.value.set(m.x, m.y)
      u.uOpacity.value = o * (1 - Math.min(1, rig.heroP * 3))
      u.uGlow.value = pulse
      // posição da peça na tela, no mesmo sistema do shader (y: -0.5 embaixo, 0.5 em cima)
      u.uLight.value.set((root.current.position.x / (halfH * 2)), root.current.position.y / (halfH * 2))

      // rastro: novo ponto quando o cursor anda; força pela velocidade; envelhece e some
      const asp = state.size.width / state.size.height
      const tx = (rig.pointer.x * 0.5) * asp
      const ty = rig.pointer.y * 0.5
      const tr = trail.current
      for (const v of tr) v.z += dt
      const lp = lastP.current
      const dist = lp.set ? Math.hypot(tx - lp.x, ty - lp.y) : 0
      if (!reduced && lp.set && dist > 0.006) {
        const oldest = tr.reduce((a, b) => (b.z > a.z ? b : a))
        oldest.set(tx, ty, 0, Math.min(1, dist * 22))
      }
      lp.x = tx
      lp.y = ty
      lp.set = true
      for (const v of tr) if (v.z > TRAIL_LIFE) v.w = 0

      const su = mats.sand.uniforms
      for (const uu of [u, su]) {
        uu.uTrail.value = tr
        uu.uRes.value.copy(u.uRes.value)
        uu.uTime.value = u.uTime.value
        uu.uMouse.value.copy(u.uMouse.value)
        uu.uLight.value.copy(u.uLight.value)
        uu.uGlow.value = u.uGlow.value
      }
      su.uOpacity.value = u.uOpacity.value
      su.uPx.value = px_ratio(state)
    }
    sand.current.visible = sk.visible
  })

  return (
    <>
      <group ref={root} visible={false}>
        <group ref={spinner}>
          <mesh geometry={geo.frame} material={mats.glow} />
          <mesh ref={core} geometry={geo.core} material={mats.coreMat} />
        </group>
      </group>
      {/* céu de nuvens em tela cheia, desenhado antes de tudo */}
      <mesh ref={sky} material={mats.sky} frustumCulled={false} renderOrder={-2} visible={false}>
        <planeGeometry args={[2, 2]} />
      </mesh>
      {/* grãos de areia levantados pelo cursor (atrás do chão) */}
      <points ref={sand} geometry={geo.sand} material={mats.sand} frustumCulled={false} renderOrder={-1.5} visible={false} />
      {/* chão de estúdio */}
      <mesh ref={floor} material={mats.floor} rotation-x={-Math.PI / 2} position-y={FLOOR_Y} visible={false} renderOrder={-1}>
        <planeGeometry args={[60, 40]} />
      </mesh>
    </>
  )
}
