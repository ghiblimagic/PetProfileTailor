import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";

export const SIGNUP_PASSWORD_MIN_LENGTH = 6;

export type SignupFieldErrors = {
  name?: string;
  profilename?: string;
  email?: string;
  password?: string;
  over13?: string;
};

export type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  profileName?: string;
  over13?: boolean;
  captchaToken?: string;
};

/** Client-side field checks — no DB or captcha. */
export function validateSignupFields(body: SignupBody): SignupFieldErrors {
  const { name, email, password, profileName, over13 } = body;
  const errors: SignupFieldErrors = {};

  if (!name) errors.name = "Please enter a name";
  if (!email) errors.email = "Please enter an email";
  if (email && !email.includes("@")) {
    errors.email = "Please enter a valid email";
  }
  if (!profileName) errors.profilename = "Please enter a profile name";
  if (!over13) errors.over13 = "You must confirm you are over 13";

  if (profileName) {
    const invalidProfileNameInput = regexInvalidInput(profileName);
    if (invalidProfileNameInput != null) {
      errors.profilename = `Invalid characters entered: ${invalidProfileNameInput}`;
    }
  }

  if (password && password.length < SIGNUP_PASSWORD_MIN_LENGTH) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
}

export function hasSignupFieldErrors(errors: SignupFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
