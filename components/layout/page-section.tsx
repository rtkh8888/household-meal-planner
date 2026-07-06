import type { ReactNode } from 'react';

export function PageSection({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-white/95 p-5 shadow-[0_10px_30px_rgba(90,60,70,0.06)] backdrop-blur-sm sm:p-6">
      <p className="inline-flex rounded-full border border-[#D3C3AE] bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#4F453B]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

