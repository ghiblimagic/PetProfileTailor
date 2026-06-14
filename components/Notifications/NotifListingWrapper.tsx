/**
 * Shared notifications list shell — load more, recheck cooldown, empty/end states.
 * Notes: docs/notes/app/notifications-page.md
 */
"use client";

import type { ComponentType, ReactNode } from "react";
import LoadingSpinner from "@components/Shared/ui/LoadingSpinner";
import GeneralButton from "@components/Shared/actions/GeneralButton";
import Image from "next/image";
import { useLocalStorageCooldown } from "@/hooks/useLocalStorageCooldown";
import type {
  NotificationModelType,
  SwrSimpleReturn,
} from "@/hooks/useSwrSimple";

export type NotificationDoc = {
  _id: string;
};

export type NotificationListingProps = {
  singleContent: NotificationDoc;
};

export type NotifListingWrapperProps = {
  swrHook: SwrSimpleReturn;
  /** Flattened SWR pages; each row must have `_id` for list keys. */
  docs: unknown[];
  noNotificationsMessage: ReactNode;
  handleLoadMore: (swrHook: SwrSimpleReturn) => void;
  ListingComponent: ComponentType<NotificationListingProps>;
  swrType: NotificationModelType;
};

export default function NotifListingWrapper({
  swrHook,
  docs,
  noNotificationsMessage,
  handleLoadMore,
  ListingComponent,
  swrType,
}: NotifListingWrapperProps) {
  const { canClick, formattedTimer, trigger } = useLocalStorageCooldown(
    `lastRecheck-notifications${swrType}`,
    120,
  );

  const handleRecheck = () => {
    if (!trigger()) return;
    swrHook.mutate(); // since we need to recheck from page 1
  };

  return (
    <section className="whitespace-pre-line">
      {swrHook.SWRisReachingEnd && (
        <div
          id="#recheck"
          className="text-center my-6 py-3 border-t-2 border-subtleWhite"
        >
          <p className="mt-2 mb-2">
            To keep the app free, the recheck button can only be clicked every 2
            minutes.
          </p>
          <p> Thanks for your patience! </p>

          <GeneralButton
            type="button"
            text={canClick ? "Recheck" : `Wait ${formattedTimer}`}
            subtle
            disabled={swrHook.isLoading || !canClick}
            onClick={handleRecheck}
          />
        </div>
      )}

      {swrHook.isLoading && <LoadingSpinner />}

      {Array.isArray(docs) &&
        docs.length > 0 &&
        docs.map((singleContent) => {
          const doc = singleContent as NotificationDoc;
          return (
            <ListingComponent singleContent={doc} key={doc._id} />
          );
        })}

      {!swrHook.isLoading && docs?.length === 0 && noNotificationsMessage}

      {!swrHook.SWRisReachingEnd ? (
        <div className="flex justify-center">
          <GeneralButton
            type="button"
            text="load more"
            subtle
            disabled={swrHook.isLoading}
            onClick={() => handleLoadMore(swrHook)}
          />
        </div>
      ) : (
        <div className="text-center my-6">
          <p className="mb-4">
            We dug deep but there&apos;s no more content hidden here!
          </p>
          <Image
            src="/digging-dog.svg"
            alt="dog digging a hole"
            width={218}
            height={150}
            unoptimized={true}
            loading="lazy"
            className="block mx-auto"
            // Image is wrapped in a span, so we need to change it to block for mx-auto to work
          />

          <small>
            Dog Digging Icon Designed brgfx on Freepik{" "}
            <a href="https://www.freepik.com/free-vector/dog-digging-dirt-white-background_18973243.htm">
              <span className="block">Click here to go to source</span>
            </a>{" "}
          </small>
        </div>
      )}
    </section>
  );
}
