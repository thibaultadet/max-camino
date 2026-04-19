import PhotoCarousel from "@/components/PhotoCarousel";
import SectionHeading from "@/components/SectionHeading";
import StagesMapWrapper from "@/components/StagesMapWrapper";
import ViewToggle from "@/components/ViewToggle";
import WelcomeMessage from "@/components/WelcomeMessage";
import { getStages, getAllRegistrationsByStage } from "@/lib/airtable";
import { getPublicImagePaths } from "@/lib/getPublicImages";

export const revalidate = 60;

export default async function Home() {
  const [stages, registrationsByStage] = await Promise.all([
    getStages(),
    getAllRegistrationsByStage(),
  ]);
  const publicPhotos = getPublicImagePaths();

  return (
    <main className="mx-auto w-full px-4 pb-20 pt-12 md:px-8 md:pt-16">
      <WelcomeMessage
        midSection={
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-10 w-screen max-w-[100vw] overflow-x-hidden md:mt-12">
            <PhotoCarousel imagePaths={publicPhotos} variant="hero" />
          </div>
        }
      />

      <div id="rejoindre-chemin" className="scroll-mt-6 md:scroll-mt-8">
        <section className="mt-16 md:mt-24" aria-labelledby="map-title">
          <SectionHeading
            eyebrow="Parcours"
            title="L'itinéraire sur la carte"
            titleId="map-title"
            className="mb-8 md:mb-10"
          />
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] overflow-x-hidden">
            <StagesMapWrapper stages={stages} />
          </div>
        </section>

        <section className="mt-16 md:mt-24" aria-labelledby="stages-title">
          <SectionHeading
            eyebrow="Rejoindre Max"
            title="Étapes et inscriptions"
            titleId="stages-title"
            className="mb-8 md:mb-10"
          />
          <ViewToggle stages={stages} registrationsByStage={registrationsByStage} />
        </section>
      </div>
    </main>
  );
}
