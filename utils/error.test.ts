import { getError } from "./error";

describe("getError", () => {
  it("returns axios-style response message when present", () => {
    const err = {
      response: { data: { message: "Invalid credentials" } },
      message: "Request failed",
    };
    expect(getError(err)).toBe("Invalid credentials");
  });

  it("returns Error message for plain Error instances", () => {
    expect(getError(new Error("Something broke"))).toBe("Something broke");
  });

  it("stringifies unknown values", () => {
    expect(getError("network down")).toBe("network down");
    expect(getError(null)).toBe("null");
  });
});
