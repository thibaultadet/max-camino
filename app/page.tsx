import StagesMapWrapper from "@/components/StagesMapWrapper";
import ViewToggle from "@/components/ViewToggle";
import { getStages, getAllRegistrationsByStage } from "@/lib/airtable";

export const revalidate = 60;

export default async function Home() {
  const [stages, registrationsByStage] = await Promise.all([
    getStages(),
    getAllRegistrationsByStage(),
  ]);

  return (
    <main className="px-4 md:px-10 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-1">Le Chemin de Max</h1>
        <p className="text-gray-500">{stages.length} étapes</p>
      </div>

      <StagesMapWrapper stages={stages} />

      <ViewToggle stages={stages} registrationsByStage={registrationsByStage} />
    </main>
  );
}
