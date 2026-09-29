import { contact } from '../data/content'

export function Footer() {
  return (
    <footer className="foot">
      <p className="foot__brand">WebGhost</p>
      <nav className="foot__links" aria-label="Redes">
        {contact.social.map((s) => (
          <a key={s.label} href={s.href} className="ulink" target="_blank" rel="noreferrer">{s.label}</a>
        ))}
      </nav>
      <p className="micro foot__legal">© 2026 WebGhost. Todos os direitos reservados.</p>
      <p className="micro foot__legal">São Paulo, Brasil</p>
    </footer>
  )
}
