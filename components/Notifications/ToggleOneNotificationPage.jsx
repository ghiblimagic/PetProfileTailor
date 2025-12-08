"use client";

import React, { useState, useEffect } from "react";
import GeneralOpenCloseButton from "../ReusableSmallComponents/buttons/generalOpenCloseButton";
import CoreListingPageLogic from "../CoreListingPagesLogic";
import ThanksContentListing from "./ThankNotificationListing";
import { useNotifications } from "@/context/notificationsContext";
import GeneralButton from "../ReusableSmallComponents/buttons/GeneralButton";
import { useSWRSimple } from "@/hooks/useSwrSimple";
import LikesContentListing from "./LikeNotificationListing";
import LoadingSpinner from "../ui/LoadingSpinner";
import NotifListingWrapper from "./NotifListingWrapper";
import LikeNotificationListing from "@/components/Notifications/LikeNotificationListing";
import IconOpenCloseButton from "../ReusableSmallComponents/buttons/iconOpenCloseButton";

export default function ToggleOneNotificationPage({
  contentList,
  swrForThisUserID,
  defaultOpen = "names",
  initialNamesDocs,
}) {
  const [openContent, setOpenContent] = useState(defaultOpen);

  // wait to load name and desc docs until after the user clicks those notifications sections

  const {
    notifications,
    setNotifications,
    notificationsTotal,
    timeGrabbed,
    resetNotificationType,
  } = useNotifications();

  console.log("notifications in toggle", notifications);

  //############## SWR #################

  const thanksSWR = useSWRSimple("thanks", {
    revalidateFirstPage: false,
    enabled: openContent === "thanks",
  });

  const namesSWR = useSWRSimple("names", {
    initialPage: initialNamesDocs,
    // below is because we're getting data from the server, so don't grab the 1st page
    revalidateFirstPage: false,
    // revalidateFirstPage: only about automatic revalidations (like after focus, reconnect, or cache invalidation).
    revalidateIfStale: false,
    revalidateOnMount: false,
  });

  // console.log("namesSWR ", namesSWR );

  const descriptionsSWR = useSWRSimple("descriptions", {
    revalidateFirstPage: false,
    enabled: openContent === "descriptions",
  });

  console.log("descriptionsSWR  ", descriptionsSWR);
  // The hook is mounted all the time, so size, mutate, cache, etc. are preserved.
  // SWR will remember previously loaded pages.
  // The first fetch is truly lazy: it only fires when enabled === true.
  // Switching tabs doesn’t reset anything because the hook never unmounted.

  // const descriptionsSWR  =
  //   openContent === "descriptions"
  //     ? useSWRSimple("descriptions", { revalidateFirstPage: false })
  //     : null;

  // Extract notifications if SWR exists
  const thankDocs = thanksSWR?.SWRNotifications || [];
  console.log("this is thank docs", thankDocs);
  const nameDocs = namesSWR?.SWRNotifications || [];
  const descDocs = descriptionsSWR?.SWRNotifications || [];

  console.log("descDocs", descDocs);
  // const descDocs = descriptionsSWR ?.SWRNotifications || [];

  // swr properties:
  // SWRNotifications,
  // error,
  // isLoading,
  // SWRisReachingEnd,
  // size,
  // setSize,
  // mutate,

  const handleLoadMore = (SWRType) => {
    console.log("handle load more ran");
    if (!SWRType.SWRisReachingEnd) SWRType.setSize((s) => s + 1);
  };

  function handleContentClick(contentKey) {
    setOpenContent(openContent === contentKey ? null : contentKey);

    // if its descriptions,
    // is notification # not 0
    // load the api to grab descriptions
    // if its names, load the api to grab names
    // is notification # not 0
    // load the api to grab descriptions
  }

  function notificationCount(content) {
    const lookup = {
      thanks: notifications.thanks,
      names: notifications.names,
      descriptions: notifications.descriptions,
    };
    return lookup[content] ?? 0;
  }

  function setNotificationCountToZero() {
    if (openContent === "names") {
      if (notifications.names !== 0) {
        resetNotificationType("names");
      }
    } else if (openContent === "descriptions") {
      {
        if (notifications.descriptions !== 0) {
          resetNotificationType("descriptions");
        }
      }
    } else {
      if (notifications.thanks !== 0) {
        resetNotificationType("thanks");
      }
    }
  }

  useEffect(() => {
    const swrMap = {
      thanks: thanksSWR,
      names: namesSWR,
      descriptions: descriptionsSWR,
    };

    const currentCount = notificationCount(openContent);

    if (currentCount === 0) return;
    let canceled = false;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    // When the timer finishes, it calls resolve(), the Promise completes, and the reference is released
    // React GC (garbage collection) cleans it up once it resolves

    const currentSWR = swrMap[openContent];

    const waitForSWRAndReset = async () => {
      if (!currentSWR) return;

      // Wait for SWR to finish loading
      while (currentSWR.isLoading) {
        await sleep(200);
        if (canceled) return;
      }

      // Wait 3 seconds before resetting
      await sleep(3000);
      if (canceled) return;

      setNotificationCountToZero();
    };

    waitForSWRAndReset();

    // cleanup function
    // in case openContent changes before timeout
    // this way if the user jumps to another notification field the notifications they didn't read don't get set to 0

    // 1. The local variable canceled is initialized to false inside that effect’s closure.
    // 2. React registers this cleanup function
    // 3. Before re-running the effect (because dependencies changed) or before the component unmounts, React calls the cleanup function
    // means cleanup runs and resets this specific useEffect's canceled = true (closure), just before the next effect execution or component removal

    return () => {
      canceled = true;
    };
  }, [
    openContent,
    notifications,
    thanksSWR.isLoading,
    namesSWR.isLoading,
    descriptionsSWR.isLoading,
  ]);

  const noNotificationsMessage = (
    // this is a JSX literal not a JSX component
    // so we render it directly, rather than calling it like a JSX component/function
    <div
      className={`rounded-2xl px-4 mt-2 p-4 text-subtleWhite ml-5 my-2   hover:bg-secondary/60 text-center `}
    >
      <p className="my-1">Woah, it&apos;s so empty! 😿</p>
      <p className="my-1">
        These pets will use this as a cozy nap spot until you get a notification
        🐈🐕.
      </p>
    </div>
  );
  return (
    <section className="w-full  max-w-[800px]">
      <div className="flex justify-around">
        {contentList.map((category) => (
          <IconOpenCloseButton
            key={category.value}
            text={category.text}
            setState={handleContentClick}
            className={category.className}
            value={category.value}
            state={openContent}
            icon={category.icon}
            unreadCount={notificationCount(category.type)}
          />
        ))}
      </div>
      {openContent === "thanks" && (
        <NotifListingWrapper
          swrHook={thanksSWR}
          docs={thankDocs}
          swrType="thanks"
          noNotificationsMessage={noNotificationsMessage}
          handleLoadMore={handleLoadMore}
          ListingComponent={ThanksContentListing}
        />
      )}

      {openContent === "names" && (
        <NotifListingWrapper
          swrHook={namesSWR}
          swrType="names"
          docs={nameDocs}
          noNotificationsMessage={noNotificationsMessage}
          handleLoadMore={handleLoadMore}
          ListingComponent={LikesContentListing}
        />
      )}

      {/* ################ descriptions #################*/}
      {openContent === "descriptions" && (
        <NotifListingWrapper
          swrHook={descriptionsSWR}
          docs={descDocs}
          swrType="descriptions"
          noNotificationsMessage={noNotificationsMessage}
          handleLoadMore={handleLoadMore}
          ListingComponent={LikesContentListing}
        />
      )}
    </section>
  );
}
