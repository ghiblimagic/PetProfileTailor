/**
 * Treats count + rank label for dashboard/profile points.
 * Notes: docs/notes/components/ranking.md
 */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCookieBite, faRankingStar } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import RankNames from "./RankNames";

export type RankingTotalsProps = {
  totalPoints: number;
};

export default function RankingTotals({ totalPoints }: RankingTotalsProps) {
  function rankingLine(
    points: number,
    faIcon: IconDefinition,
    label: string,
    rankNames: boolean,
  ) {
    return (
      <div className="w-full   ">
        <section className="flex  w-fit  mx-auto mb-4  ">
          <div className="flex  align-text-top">
            <div className="mr-2 text-right">
              <FontAwesomeIcon
                icon={faIcon}
                className="text-xl  mx-auto text-yellow-300"
              />
            </div>
            <span className="inline-block  text-right">{label}:</span>
          </div>

          <div className="w-full text-left ml-1">
            {rankNames ? (
              <RankNames points={points} />
            ) : (
              <span>{points}</span>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="overallStats mb-2 font-bold text-white mx-auto">
      <div className="w-full mx-auto space-y-2">
        {rankingLine(totalPoints, faCookieBite, "Treats", false)}
        {rankingLine(totalPoints, faRankingStar, "Rank", true)}
      </div>
    </section>
  );
}
