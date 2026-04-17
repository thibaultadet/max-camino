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
    <main className="px-4 md:px-10 py-10">
      <Link href="/" className="text-sm text-[#e07b00] hover:underline mb-8 inline-block">
        ← Toutes les étapes
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-100 flex flex-col items-center justify-center text-center leading-tight">
          <span className="text-xs font-bold text-[#e07b00] uppercase tracking-wide">
            {dateObj.toLocaleDateString("fr-FR", { month: "short" })}
          </span>
          <span className="text-2xl font-bold text-[#c45e00]">{dateObj.getDate()}</span>
          <span className="text-[10px] text-gray-400">{dateObj.getFullYear()}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] leading-tight">{stage.title}</h1>
          <p className="text-gray-500 mt-1">{stage.km} km</p>
        </div>
      </div>

      <div className="mb-10 rounded-xl overflow-hidden border border-amber-100 shadow-sm">
        <iframe src={stage.komoot_embed_url} width="100%" height="580" allowFullScreen />
      </div>

      <div className="border border-amber-200 rounded-xl p-6 bg-amber-50 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Marcher avec Max</h2>
          <p className="text-sm text-gray-500">Inscris ton prénom pour rejoindre cette étape.</p>
        </div>

        <RegisterForm stages={slug} />

        {registrations.length > 0 && (
          <div className="pt-2 border-t border-amber-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              {registrations.length} inscrit{registrations.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {registrations.map((r) => (
                <span key={r.id} className="bg-white border border-amber-200 text-sm text-[#1a1a1a] px-3 py-1 rounded-full">
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
