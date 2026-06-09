import regexInvalidInput from "./check-for-valid-content";

describe("regexInvalidInput (name content rules)", () => {
  it("allows letters, digits, and permitted punctuation", () => {
    expect(regexInvalidInput("Fluffy")).toBeNull();
    expect(regexInvalidInput("O'Malley")).toBeNull();
    expect(regexInvalidInput("co-op")).toBeNull();
  });

  it("rejects disallowed characters", () => {
    expect(regexInvalidInput("hello@world")).toEqual(["@"]);
  });

  it("rejects double spaces", () => {
    expect(regexInvalidInput("fluffy  butt")).toEqual(["extra spaces"]);
  });
});
