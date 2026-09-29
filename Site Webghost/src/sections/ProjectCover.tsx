import type { Project } from '../data/content'

/**
 * Capas provisórias montadas em HTML (sem imagens externas).
 * Para usar screenshots reais: troque o <div className="cover ..."> por
 * <img src="/projects/nome.webp" loading="lazy" decoding="async" alt="…" />.
 */
export function ProjectCover({ kind }: { kind: Project['cover'] }) {
  if (kind === 'dashboard')
    return (
      <div className="cover cover--dash" aria-hidden="true">
        <div className="cd__side">
          <b>OS</b>
          <i /><i className="on" /><i /><i />
        </div>
        <div className="cd__main">
          <div className="cd__top">
            <span>Ordens de serviço</span>
            <span className="cd__pill">Nova OS</span>
          </div>
          <div className="cd__kpis">
            <div><small>Abertas</small><strong>128</strong></div>
            <div><small>Em campo</small><strong>34</strong></div>
            <div><small>Concluídas / mês</small><strong>1.482</strong></div>
          </div>
          <div className="cd__table">
            {[
              ['#1482', 'Manutenção preventiva', 'Em campo'],
              ['#1481', 'Instalação de equipamento', 'Aberta'],
              ['#1480', 'Visita técnica', 'Concluída'],
              ['#1479', 'Troca de peça', 'Concluída'],
              ['#1478', 'Orçamento', 'Aberta'],
            ].map((r) => (
              <div className="cd__row" key={r[0]}>
                <span className="tnum">{r[0]}</span>
                <span>{r[1]}</span>
                <span className="cd__st">{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

  if (kind === 'mobile')
    return (
      <div className="cover cover--mobile" aria-hidden="true">
        {[0, 1].map((k) => (
          <div className="cm__phone" key={k}>
            <div className="cm__bar"><span>{k ? 'Leitura OCR' : 'Hoje'}</span><span className="tnum">09:41</span></div>
            {k === 0 ? (
              <div className="cm__list">
                {['08:00  Vistoria — Centro', '10:30  Instalação — Norte', '13:00  Retorno — Sul', '15:30  Entrega — Oeste'].map((t, i) => (
                  <div className={`cm__item ${i === 1 ? 'on' : ''}`} key={t}>{t}</div>
                ))}
              </div>
            ) : (
              <div className="cm__scan">
                <div className="cm__doc"><i /><i /><i /><i /></div>
                <div className="cm__fields">
                  <span>CNPJ reconhecido</span><span>Endereço reconhecido</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )

  return (
    <div className="cover cover--landing" aria-hidden="true">
      <div className="cl__nav"><b>PubliEventos</b><span>Eventos  Estrutura  Contato</span></div>
      <div className="cl__layers">
        <span className="cl__l cl__l1">Eventos</span>
        <span className="cl__l cl__l2">que ficam</span>
        <span className="cl__l cl__l3">na memória.</span>
      </div>
      <div className="cl__foot"><span>Solicitar orçamento</span><span className="tnum">01 / 04</span></div>
    </div>
  )
}
