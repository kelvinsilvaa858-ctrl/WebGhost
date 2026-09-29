import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { ScrollTrigger, getLenis, initSmoothScroll } from './lib/scroll'
import { rig } from './lib/rig'
import { markLoaded } from './lib/load'
import { matches, mq } from './lib/device'
import { useMedia } from './lib/useMedia'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { PageTransition, veilSupported } from './components/PageTransition'
import { Nav } from './components/Nav'
import { SideIndex } from './components/SideIndex'
import { Hero } from './sections/Hero'
import { Services } from './sections/Services'
import { Projects } from './sections/Projects'
import { Process } from './sections/Process'
import { About } from './sections/About'
import { Manifesto } from './sections/Manifesto'
import { Contact } from './sections/Contact'
import { Footer } from './sections/Footer'
import { AllProjects } from './components/AllProjects'

// o 3D carrega em paralelo ao resto da página
const Scene = lazy(() => import('./components/three/Scene'))

export default function App() {
  const [ready, setReady] = useState(false)
  // com WebGL2, o próprio véu é a tela de carregamento; sem ele, o loader clássico
  const [veil] = useState(veilSupported)
  const mobile = useMedia(mq.mobile)

  useLayoutEffect(() => {
    rig.reduced = matches(mq.reduce)
    initSmoothScroll(rig.reduced)
    document.documentElement.classList.add('is-loading')
  }, [])

  const onDone = useCallback(() => {
    setReady(true)
    document.documentElement.classList.remove('is-loading')
    getLenis()?.start()
    // sem ScrollTrigger.refresh() aqui: a barra de rolagem tem espaço reservado (scrollbar-gutter),
    // então liberar o scroll não muda o layout — recalcular agora só travaria a abertura
  }, [])

  useEffect(() => {
    document.fonts?.ready.then(() => {
      markLoaded('fonts')
      ScrollTrigger.refresh()
    })
    if (document.readyState === 'complete') markLoaded('window')
    else window.addEventListener('load', () => markLoaded('window'), { once: true })
  }, [])

  return (
    <>
      <a href="#servicos" className="skip">Pular para o conteúdo</a>
      {!veil && <Loader onDone={onDone} />}
      <PageTransition boot={veil} onBootDone={onDone} />
      <Cursor />
      <Suspense fallback={null}>
        <Scene mobile={mobile} />
      </Suspense>
      <Nav ready={ready} />
      <SideIndex />
      <main>
        <Hero ready={ready} />
        <Services />
        <Projects />
        <Process />
        <About />
        <Manifesto />
        <Contact />
      </main>
      <Footer />
      <AllProjects />
    </>
  )
}
