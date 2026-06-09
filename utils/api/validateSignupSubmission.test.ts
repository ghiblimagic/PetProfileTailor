import {
  SIGNUP_PASSWORD_MIN_LENGTH,
  hasSignupFieldErrors,
  validateSignupFields,
} from "./validateSignupSubmission";

const validBase = {
  name: "Test User",
  email: "new@example.com",
  profileName: "newprofile",
  over13: true,
  password: "secret12",
};

describe("validateSignupFields", () => {
  it("accepts a valid payload", () => {
    expect(validateSignupFields(validBase)).toEqual({});
    expect(hasSignupFieldErrors(validateSignupFields(validBase))).toBe(false);
  });

  it("requires name, email, profile name, and over13", () => {
    const errors = validateSignupFields({});
    expect(errors.name).toBe("Please enter a name");
    expect(errors.email).toBe("Please enter an email");
    expect(errors.profilename).toBe("Please enter a profile name");
    expect(errors.over13).toBe("You must confirm you are over 13");
  });

  it("rejects email without @", () => {
    const errors = validateSignupFields({ ...validBase, email: "notanemail" });
    expect(errors.email).toBe("Please enter a valid email");
  });

  it("rejects invalid profile name characters", () => {
    const errors = validateSignupFields({
      ...validBase,
      profileName: "bad@name",
    });
    expect(errors.profilename).toContain("Invalid characters");
    expect(errors.profilename).toContain("@");
  });

  it("rejects short passwords when password is provided", () => {
    const errors = validateSignupFields({
      ...validBase,
      password: "a".repeat(SIGNUP_PASSWORD_MIN_LENGTH - 1),
    });
    expect(errors.password).toBe("Password must be at least 6 characters");
  });

  it("allows omitted password (magic-link style signup)", () => {
    const { password: _p, ...withoutPassword } = validBase;
    expect(validateSignupFields(withoutPassword)).toEqual({});
  });
});
