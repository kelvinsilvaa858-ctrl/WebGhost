import pageVillage from '../assets/pages/village-torre.webp'
import pageFarofa from '../assets/pages/farofa.webp'
import pageEsquadrilax from '../assets/pages/esquadrilax.webp'
import pageCardoso from '../assets/pages/cardoso.webp'
import pagePublieventos from '../assets/pages/publieventos.webp'
import pageTatuaria from '../assets/pages/tatuaria-parks.webp'
import publieventosImg from '../assets/projects/publieventos.webp'
import publiagendaImg from '../assets/projects/publiagenda.webp'
import farofaImg from '../assets/projects/farofa.webp'
import villageTorreImg from '../assets/projects/village-torre.webp'
import hp1000Video from '../assets/projects/1000hp.mp4'
import hp1000Webm from '../assets/projects/1000hp.webm'
import hp1000Poster from '../assets/projects/1000hp-poster.webp'
import esquadrilaxImg from '../assets/projects/esquadrilax.webp'
import cardosoImg from '../assets/projects/cardoso.webp'
import tatuariaImg from '../assets/projects/tatuaria-parks.webp'

/**
 * Todo o texto da página mora aqui — troque sem mexer nos componentes.
 * Projetos: substitua as capas por screenshots reais quando tiver (ver ProjectCover).
 */

export const nav = [
  { label: 'Projetos', href: '#projetos' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Processo', href: '#processo' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Contato', href: '#contato' },
]

/** WhatsApp de todos os botões "Começar um projeto" (já com uma mensagem inicial) */
export const WHATSAPP_NUMBER = '5511937691506'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Olá! Vim pelo site da WebGhost e quero começar um projeto.',
)}`

export const contact = {
  // email: 'contato@webghost.com.br', // desativado por enquanto — reative aqui e em Contact/Footer quando tiver o e-mail real
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/web.ghosttt/' },
    { label: 'Behance', href: 'https://behance.net/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/' },
  ],
}

export const services = [
  {
    name: 'Websites',
    desc: 'Sites institucionais e landing pages desenhados do zero, com direção de arte, movimento e performance tratados como parte do projeto.',
    tags: ['Institucionais', 'Landing pages', 'E-commerce', 'CMS'],
  },
  {
    name: 'Software',
    desc: 'Sistemas web sob medida: painéis, agendas, ordens de serviço, áreas de cliente. A regra do seu negócio vira produto.',
    tags: ['SaaS', 'PWA', 'Dashboards', 'Integrações'],
  },
  {
    name: 'Experiências digitais',
    desc: 'Interfaces interativas, 3D em tempo real e narrativas guiadas por scroll para lançamentos, campanhas e marcas que querem ser lembradas.',
    tags: ['WebGL / 3D', 'Scroll narrativo', 'Microinterações'],
  },
]

export type Project = {
  name: string
  /** foto/print do projeto (16:10). Sem ela, o card usa a capa provisória em HTML. */
  image?: string
  /** vídeo curto em loop (16:10, sem áudio); `image` vira a capa enquanto carrega */
  video?: string
  /** mesma versão em WebM (VP9) — o navegador escolhe a que suportar */
  videoWebm?: string
  /** página completa do site (print de cima a baixo) — aberta ao clicar no card em "Todos os projetos" */
  page?: string
  category: string
  year: string
  desc: string
  cover: 'dashboard' | 'mobile' | 'landing'
}

export const projects: Project[] = [
  {
    name: 'OrdemServ',
    category: 'Software / SaaS',
    year: '2026',
    desc: 'Gestão de ordens de serviço multiempresa para negócios de serviço.',
    cover: 'dashboard',
  },
  {
    name: 'PubliAgenda',
    image: publiagendaImg,
    category: 'Software / PWA',
    year: '2026',
    desc: 'Agenda de campo e ordens de serviço com leitura de documentos por OCR.',
    cover: 'mobile',
  },
  {
    name: 'PubliEventos',
    page: pagePublieventos,
    image: publieventosImg,
    category: 'Website / Landing page',
    year: '2026',
    desc: 'Landing page com hero em camadas e profundidade guiada pelo scroll.',
    cover: 'landing',
  },
  {
    name: 'Farofa Pet Shop',
    page: pageFarofa,
    image: farofaImg,
    category: 'Website / Pet shop',
    year: '2026',
    desc: 'Site de pet shop com produtos, serviços e agendamento de horário.',
    cover: 'landing',
  },
  {
    name: 'Village Torre',
    page: pageVillage,
    image: villageTorreImg,
    category: 'Website / Espaço de eventos',
    year: '2026',
    desc: 'Site para espaço de eventos em Caieiras/SP, com estrutura, galeria e contato pelo WhatsApp.',
    cover: 'landing',
  },
  {
    name: '1000HP',
    video: hp1000Video,
    videoWebm: hp1000Webm,
    image: hp1000Poster,
    category: 'Website / Câmbio automático',
    year: '2026',
    desc: 'Site para oficina de câmbio automático, com hero em vídeo e serviços especializados.',
    cover: 'landing',
  },
  {
    name: "Es'quadrilax",
    page: pageEsquadrilax,
    image: esquadrilaxImg,
    category: 'Website / Esquadrias de alumínio',
    year: '2026',
    desc: 'Site para empresa de esquadrias de alumínio, com soluções, projetos e pedido de orçamento.',
    cover: 'landing',
  },
  {
    name: 'Cardoso Odontologia',
    page: pageCardoso,
    image: cardosoImg,
    category: 'Website / Odontologia',
    year: '2026',
    desc: 'Site para clínica odontológica, com tratamentos, resultados e agendamento de avaliação.',
    cover: 'landing',
  },
  {
    name: 'Tatuaria Parks',
    page: pageTatuaria,
    image: tatuariaImg,
    category: 'Website / Estúdio de tatuagem',
    year: '2026',
    desc: 'Site para estúdio de tatuagem, com especialidades, galeria, antes e depois e agendamento pelo WhatsApp.',
    cover: 'landing',
  },
]

export const process = [
  { name: 'Descoberta', desc: 'Entendemos o negócio, o público e o que o projeto precisa provar. Conversas, referências e o que já existe.', out: 'Escopo e objetivos' },
  { name: 'Estratégia', desc: 'Arquitetura de informação, conteúdo e tecnologia definidos antes de qualquer pixel.', out: 'Mapa do site e stack' },
  { name: 'Design', desc: 'Direção de arte, sistema visual e protótipo com movimento. Você aprova vendo, não imaginando.', out: 'Protótipo navegável' },
  { name: 'Desenvolvimento', desc: 'Código próprio, componentizado e medido. 3D, animação e performance entram juntos.', out: 'Ambiente de homologação' },
  { name: 'Lançamento', desc: 'Publicação, métricas, SEO técnico e acompanhamento nas primeiras semanas no ar.', out: 'Site no ar e suporte' },
]

export const stats = [
  { value: 0, suffix: '', label: 'Templates usados' },
  { value: 60, suffix: ' fps', label: 'Meta de animação' },
  { value: 100, suffix: '%', label: 'Código próprio' },
]
