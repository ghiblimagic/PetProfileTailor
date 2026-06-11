export type ThanksOption = { tag: string };

export const thanksOptionsProfessional: ThanksOption[] = [
  { tag: "Used for an adoptable pet" },
  { tag: "Pet adopted with this" },
  { tag: "Inspiration for what I wrote for an adoptable pet" },
  {
    tag: "Inspiration for what I wrote for an adoptable pet and they were adopted",
  },
];

export const thanksOptionsPetOwners: ThanksOption[] = [
  { tag: "Used for personal pet" },
  { tag: "Inspiration for a personal pet's name" },
];

export const thanksOptionsAnyone: ThanksOption[] = [
  { tag: "Made me smile or laugh" },
  { tag: "I just really, really liked this" },
  { tag: "That pun/rhyme/meme/ect hit the spot" },
  { tag: "Clever!" },
];

export const thanksOptions: ThanksOption[] = [
  ...thanksOptionsProfessional,
  ...thanksOptionsPetOwners,
  ...thanksOptionsAnyone,
];
