/** Fantasminha da marca: corpo com topo arredondado e barra ondulada, dois olhos vazados. */
export function GhostMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4.5 11a7.5 7.5 0 0 1 15 0v9.6l-2.5-1.9-2.5 1.9-2.5-1.9-2.5 1.9-2.5-1.9-2.5 1.9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <ellipse className="ghost__eye" cx="9.6" cy="11.2" rx="1.25" ry="1.55" />
      <ellipse className="ghost__eye" cx="14.4" cy="11.2" rx="1.25" ry="1.55" />
    </svg>
  )
}
