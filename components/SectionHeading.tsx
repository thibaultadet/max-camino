type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  className?: string;
  /** For `aria-labelledby` on the wrapping `<section>`. */
  titleId?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  className = "",
  titleId,
}: SectionHeadingProps) {
  return (
    <header className={className}>
      <p className="font-[family-name:var(--font-display)] text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
        {eyebrow}
      </p>
      <h2
        id={titleId}
        className="font-[family-name:var(--font-display)] mt-2 text-2xl font-semibold uppercase tracking-[0.06em] text-neutral-900 md:text-3xl"
      >
        {title}
      </h2>
    </header>
  );
}
