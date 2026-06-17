import chooseRandomDefaultAvatar, {
  DEFAULT_AVATARS,
} from "./chooseRandomDefaultAvatar";

describe("chooseRandomDefaultAvatar", () => {
  it("returns one of the known default avatar paths", () => {
    for (let i = 0; i < 20; i++) {
      expect(DEFAULT_AVATARS).toContain(chooseRandomDefaultAvatar());
    }
  });
});
