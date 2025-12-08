import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

import "@etchteam/next-pagination/dist/index.css";

import { getServerSession } from "next-auth";
import { serverAuthOptions } from "@/lib/auth";

import ToastProvider from "@/wrappers/ToastWrapper";

import { SessionProviderWrapper } from "@/wrappers/SessionProviderWrapper";
import NavLayoutwithSettingsMenu from "@/components/NavBar/NavLayoutwithSettingsMenu";
import CategTagsWrapper from "@/wrappers/CategTagsWrapper";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingScreen";
import LinkButton from "@/components/ReusableSmallComponents/buttons/LinkButton";
import Image from "next/image";

// empty wrappers are needed for the providers, since providers need to be inside a client component to safely run hooks even with having "use client" at the top of the provider

// Otherwise the app will fail if the provider is directly placed here, since the layout is a server component

// wrappers are a client component what wraps the provider and {children} so the provider can safely run hooks.

// Server layout: stays server component, just renders wrappers around {children}.
import ReportsWrapper from "@/wrappers/ReportsWrapper";

import LikesWrapper from "@/wrappers/LikesWrapper";
import SuggestionsWrapper from "@/wrappers/SuggestionsWrapper";
import GoToTopButton from "@/components/ReusableSmallComponents/buttons/GoToTopButton";
import NotificationsWrapper from "@/wrappers/NotificationWrapper";

import db from "@/utils/db";
import NameCategory from "@/models/NameCategory";
import DescriptionCategory from "@/models/DescriptionCategory";
import { leanWithStrings } from "@/utils/mongoDataCleanup";
import Footer from "@/components/footer/Footer";

export const metadata = {
  metadataBase: new URL("https://homewardtails.com"),
  title:
    "Improve Adoption Rates by Creating Impactful, Fun, and Tailor-Fitted Pet Adoption Profiles!",
  description:
    "Homeward Tails is a community powered database which helps you find the perfect pet name or create pet profiles which are impactful, fun, and tailor fitted. Animal welfare professionals can use the community submitted names or descriptions to create engaging pet profiles to improve adoption rates!",
  icons: {
    icon: "/icon.png",
  },
};

// 🧠 3-hour TTL cache
let cachedCategories = null;
let lastFetched = 0;

async function getCategoriesAndTagsWithTTL() {
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const now = Date.now();

  if (cachedCategories && now - lastFetched < THREE_HOURS) {
    return cachedCategories;
  }

  await db.connect();

  const [nameCategories, descCategories] = await Promise.all([
    leanWithStrings(NameCategory.find().populate("tags").sort({ order: 1 })),
    leanWithStrings(
      DescriptionCategory.find().populate("tags").sort({ order: 1 }),
    ),
  ]);

  cachedCategories = { names: nameCategories, descriptions: descCategories };
  lastFetched = now;

  return cachedCategories;
}

export default async function RootLayout({ children }) {
  const session = await getServerSession(serverAuthOptions);
  const safeSession = session
    ? {
        ...session,
        user: session.user || {},
      }
    : null;
  //Guarantees session.user exists (or is an empty object).

  await db.connect();

  // Cached DB data
  const { names, descriptions } = await getCategoriesAndTagsWithTTL();

  return (
    <html
      lang="en"
      className="h-full bg-primary w-full"
    >
      <body className="h-full flex flex-col w-full">
        <SessionProviderWrapper session={safeSession}>
          <CategTagsWrapper
            descrCateg={descriptions}
            nameCateg={names}
          >
            <LikesWrapper>
              <NotificationsWrapper>
                <ReportsWrapper>
                  <SuggestionsWrapper>
                    <header>
                      <NavLayoutwithSettingsMenu />
                    </header>
                    <Suspense fallback={<LoadingSkeleton />}>
                      <main
                        className="flex-1  sm:px-6 lg:px-8  mx-auto  w-full" // w-full so it the element doesn't start off as collapsed
                        style={{
                          maxWidth: "1280px", // since tailwind is ignoring maxwidth in classNames
                        }}
                      >
                        {children}
                        <GoToTopButton top="280" />
                      </main>
                      {/*flex-1  in flex column means: main takes up the remaining flex space, so footer stays at the bottom */}
                    </Suspense>
                    <Analytics />
                    <ToastProvider />

                    <Footer />
                  </SuggestionsWrapper>
                </ReportsWrapper>
              </NotificationsWrapper>
            </LikesWrapper>
          </CategTagsWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
