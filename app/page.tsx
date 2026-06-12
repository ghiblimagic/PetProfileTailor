/**
 * Public landing page.
 * Notes: docs/notes/app/landing-page.md
 */
"use client";

import HeroTop from "@components/LandingPage/HeroTop";
import MediaObjectLeft from "@components/ReusableMediumComponents/MediaObjectLeft";
import MediaObjectRight from "@components/ReusableMediumComponents/MediaObjectRight";
import Image from "next/image";
import WideCenteredHeading from "@components/ReusableSmallComponents/TitlesOrHeadings/WideCenteredHeading";
import YoutubeEmbed from "@components/ShowingListOfContent/YoutubeEmbed";
import { useState } from "react";

type LandingVideoKey = "impactful" | "fun" | "tailor";

export default function HomePage() {
  //for Nav menu profile name and image
  //let section exists in case the user is not signed in

  //end of section for nav menu

  const [openVideo, setOpenVideo] = useState<LandingVideoKey | null>(null);

  function handleVideoClick(videoKey: LandingVideoKey) {
    setOpenVideo(openVideo === videoKey ? null : videoKey);
  }

  return (
    <div className="w-screen sm:w-full ">
      <HeroTop
        updateImpactfulState={() => handleVideoClick("impactful")}
        updateFunState={() => handleVideoClick("fun")}
        updateTailorState={() => handleVideoClick("tailor")}
      />
      {openVideo === "impactful" && (
        <YoutubeEmbed
          embedId="y5cx0MeHuE8"
          styling="aspect-video"
          title="Fishtopher the cat gets adopted after going viral"
          showVideoFunction={() => setOpenVideo(null)}
          key="y5cx0MeHuE8"
        />
      )}
      {openVideo === "fun" && (
        <YoutubeEmbed
          embedId="_7SMbp-W6sM"
          styling="aspect-video"
          title="Woman Writes Hilariously Honest Adoption Post For Her Wild Foster Dog | The Dodo Adopt Me!"
          showVideoFunction={() => setOpenVideo(null)}
          key="_7SMbp-W6sM"
        />
      )}
      {openVideo === "tailor" && (
        <YoutubeEmbed
          embedId="T_lAGw4lpiM"
          styling="aspect-video"
          title="Woman's Brutally Honest Pet Adoption Ad Goes Viral"
          showVideoFunction={() => setOpenVideo(null)}
          key="T_lAGw4lpiM"
        />
      )}
      <section className=" h-24 flex place-items-center justify-center">
        <h5 className="text-white text-xl md:text-2xl pr-2">Adoptions Ahoy!</h5>
        <div className="w-[110px] h-[110px] flex items-center justify-center">
          <Image
            unoptimized
            width={110}
            height={110}
            src="/smallpirate.webp"
            alt="image of a guinea pig wearing a tiny pirate hat"
            style={{
              maxWidth: "100%",
              width: "auto",
              height: "auto",
            }}
          />
          {/* //Error: Image with src "/smallpirate.webp" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.

            // When you pass both width and height to <Image>, Next.js assumes you want to preserve that ratio.
            // Next wants you to set width AND height to auto, if you're overriding the width/height ratio to ensure the aspect ratio is preserved */}
        </div>
      </section>
      <div className="">
        <section className="landingNamesSection">
          <WideCenteredHeading heading="Find the Purrfect Name" />

          <MediaObjectLeft
            image="/chamil.jpg"
            listOfText={[
              "Find eye-catching names you wouldn't find on regular sites.",
              "Easily sort by personality, species, physical traits, and more.",
              "Find names for themes such as Christmas, just in time for your adoption event!",
            ]}
            buttonText="Find Names"
            buttonTextLink="/fetchnames"
            alttext="a picture of a chameleon with a cartoony bling necklace drawn on his neck. The text underneath says: chamillionare, young, lizard, 210 miles away"
            imgwidth="220"
            imgheight="330"
            buttonStyle="subtle"
          />
        </section>

        <section className="landingDescriptionsSection">
          <WideCenteredHeading heading="Find Tailor-Fit Descriptions" />

          <MediaObjectRight
            image="/obviousplant.webp"
            listOfText={[
              "Engaging and creative descriptions.",
              "Honest and engaging wording for problem behaviors.",
              "Easily sort by personality, species, physical traits, and more.",
            ]}
            buttonText="Find Descriptions"
            buttonTextLink="/fetchdescriptions"
            alttext="Picture of an adoption sign. There is a black and white cat with the text Honey next to it. Underneath it reads: Likes: catnip. Dislikes: Birds. And in quotation marks is They are lousy sky wizards that need to obey the laws of gravity! - honey. Sante D'or adoption center obvious plant"
            imgwidth="128"
            imgheight="113"
            buttonStyle="subtle"
          />
        </section>
        <section className="landingSignUpSection">
          <WideCenteredHeading heading="Feel your impact!" />

          <MediaObjectLeft
            image="/thanks.png"
            listOfText={[
              "We appreciate our community members donating their time and want them to see the impact they've made.",
              "Find out if your submissions helped: get a pet adopted, name a personal pet, or more!",
              "Recieve in-app notifications about likes and thank you notes!",
            ]}
            buttonText="Sign Up"
            buttonTextLink="/register"
            imgwidth="400"
            imgheight="100"
            alttext="Screenshot of the notificatiosn page with 3 areas: names, descriptions and thanks. The thank menu is clicked and 2 thank you notes are shown. THey include thanks such as was inspiration for what i wrote for an adoptable pet and they were adopted, clever, used for a personal pet, I just really really liked this"
            buttonStyle="default"
          />
        </section>
        <section className="LandingWantToHelpSection">
          <WideCenteredHeading heading="Create a free profile" />

          <MediaObjectRight
            image="/profile.png"
            listOfText={[
              "Like your favorite names and descriptions for easy access & sorting.",
              "Add new names and descriptions.",
              "Make someones day by sending them thank you notes about their submissions!",
              "Edit or delete your own content",
            ]}
            buttonText="Sign Up"
            buttonTextLink="/register"
            alttext="screenshot of the dashboard for the site. It says welcome back, treats earned, shows the profile image and shows a favorites section with a list of names."
            imgwidth="600"
            imgheight="600"
            buttonStyle="default"
          />
        </section>
      </div>
    </div>
  );
}
