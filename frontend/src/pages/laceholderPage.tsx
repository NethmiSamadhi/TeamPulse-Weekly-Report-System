type Props = { eyebrow: string; title: string; description: string };

export function PlaceholderPage({ eyebrow, title, description }: Props) {
  return (
    <main className="app-page">
      <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></header>
      <section className="content-card empty-state"><span>TeamPulse workspace</span><h2>{title}</h2><p>This view will use real data from the TeamPulse API.</p></section>
    </main>
  );
}
