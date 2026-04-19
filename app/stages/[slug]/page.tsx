import { notFound } from "next/navigation";
import Link from "next/link";
import { getStages, getRegistrationsForStage } from "@/lib/airtable";
import RegisterForm from "@/components/RegisterForm";

export const revalidate = 60;

export async function generateStaticParams() {
  const stages = await getStages();
  return stages.filter((s) => s.slug).map((s) => ({ slug: s.slug }));
}

export default async function StagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stages = await getStages();
  const stage = stages.find((s) => s.slug === slug);
  if (!stage) notFound();

  const registrations = await getRegistrationsForStage(slug);
  const dateObj = new Date(stage.date);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-[#c2410c] underline-offset-4 hover:underline"
      >
        ← Toutes les étapes
      </Link>

      <div className="mb-8 flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-sm border border-neutral-200 bg-orange-50 text-center leading-tight">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#c2410c]">
            {dateObj.toLocaleDateString("fr-FR", { month: "short" })}
          </span>
          <span className="text-2xl font-bold text-[#9a3412]">{dateObj.getDate()}</span>
          <span className="text-[10px] text-neutral-400">{dateObj.getFullYear()}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-neutral-900">{stage.title}</h1>
          <p className="mt-1 text-neutral-500">{stage.km} km</p>
        </div>
      </div>

      <div className="mb-10 overflow-hidden rounded-sm border border-neutral-200 shadow-sm">
        <iframe src={stage.komoot_embed_url} width="100%" height="580" allowFullScreen />
      </div>

      <div className="space-y-4 rounded-sm border border-neutral-200 bg-[var(--background-subtle)] p-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Marcher avec Max</h2>
          <p className="text-sm text-neutral-500">Inscris ton prénom pour rejoindre cette étape.</p>
        </div>

        <RegisterForm stages={slug} />

        {registrations.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400">
              {registrations.length} inscrit{registrations.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {registrations.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-900"
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
