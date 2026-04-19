import type { ReactNode } from "react";
import ScrollToJoinButton from "@/components/ScrollToJoinButton";
import WelcomeLogoLink from "@/components/WelcomeLogoLink";

type WelcomeMessageProps = {
  /** Contenu entre le texte d’accueil et les règles (ex. carrousel photos). */
  midSection?: ReactNode;
};

export default function WelcomeMessage({ midSection }: WelcomeMessageProps) {
  return (
    <section className="w-full" aria-labelledby="welcome-heading">
      {/* Logo + titre + premier bloc sur la même ligne (à partir de md) */}
      <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-10 lg:gap-14 xl:gap-16">
        <WelcomeLogoLink />

        <div className="min-w-0 flex-1 space-y-6 text-[15px] leading-relaxed text-neutral-600 md:basis-0 md:text-base">
          <header className="text-left">
            <h1
              id="welcome-heading"
              className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-[0.05em] text-neutral-900 md:text-4xl"
            >
              La voie du Mont Blanc
            </h1>
          </header>

          <div className="space-y-4 md:space-y-5">
            <p>Bonjour ! 👋🏼</p>
            <p>
              Merci de venir jeter un œil sur mon itinéraire pour mon projet d’ouvrir une nouvelle voie du
              chemin de Compostelle : la voie du Mont Blanc ! Une voie montagnarde, un périple de milliers
              de km, avec un dénivelé à n’en plus finir, pour s’élever par l’effort, la contemplation, la
              prière et le silence 💥
            </p>
            <p>
              Ce site va permettre à ma famille, mes amis et mes collègues de découvrir mon projet, et de
              comprendre pourquoi je vais disparaître les prochains mois !
            </p>
            <p>
              Mais son principal objectif, c’est aussi de vous permettre de me rejoindre sur l’itinéraire
              pour les plus téméraires d’entre vous ! Je serais très heureux de partager quelques jours
              avec ceux qui le souhaitent !
            </p>
            <p>
              C’est facile à utiliser, vous n’avez qu’à sélectionner les étapes où vous voulez me rejoindre,
              ajouter votre nom, et valider !
            </p>
          </div>
        </div>
      </div>

      {midSection}

      {/* Deuxième bloc : règles importantes */}
      <div className="mt-10 space-y-4 pt-10 text-[15px] leading-relaxed text-neutral-600 md:space-y-5 md:text-base">
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.08em] text-neutral-900">
          Quelques règles importantes
        </p>
        <ul className="mx-auto max-w-3xl list-inside list-disc space-y-3 text-left marker:text-neutral-300 md:mx-0 md:max-w-none md:space-y-3.5">
          <li>
            Je ne limite pas en nombre mais l’idée du projet est quand même d’être dans un certain
            isolement et de profiter pleinement de la nature : évitez les gros groupes 😅
          </li>
          <li>
            Si vous venez vous vous débrouillez complètement pour la logistique : arrivée/départ -
            nourriture - tente … ⛺️
          </li>
          <li>
            C’est une aventure sportive : soyez prêts à faire du dénivelé et marcher longtemps ! 🥾
          </li>
          <li>
            L’itinéraire est déjà tracé mais peut évoluer et sur cet aspect-là je serais le principal
            maître à bord 🫡
          </li>
          <li>
            C’est aussi une aventure spirituelle : Je ménagerais des temps quotidiens pour prier et si je
            peux assister à des messes je le ferais - ça ne vous oblige à rien si ce n’est à attendre à ce
            moment-là 🙏🏼
          </li>
          <li>
            Vous avez un risque de finir sur mes photos 📸 et surtout d’attendre pendant que j’en prends …
          </li>
          <li>
            C’est pas impossible que je vous demande de me ramener des choses si je sais que vous venez ☺️
          </li>
        </ul>

        <ScrollToJoinButton />
      </div>
    </section>
  );
}
