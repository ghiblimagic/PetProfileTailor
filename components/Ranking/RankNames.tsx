/**
 * Treats rank title from point total.
 * Notes: docs/notes/components/ranking.md
 */

const RANK_TITLES_BY_TIER: Record<number, string> = {
  0: "Baby Toe Beans",
  1: "Autodromkatzerl/Bumper Car Tail Kitten",
  2: "The Tiniest Woofer",
  3: "World Class Shoe Chewer",
  4: "Baby Gate Jumper Extraordinaire",
};

export type RankNamesProps = {
  points: number;
};

export default function RankNames({ points }: RankNamesProps) {
  const pointsDividedBy10 = Math.floor(points / 10);
  const rankName =
    RANK_TITLES_BY_TIER[pointsDividedBy10] ?? "A good pupper";

  return (
    <span className="text-subtleWhite inline-block m-0">{` ${rankName}`}</span>
  );
}
