/**
 * Flow notes: docs/notes/app/api/signup-route.md
 */
import bcryptjs from "bcryptjs";
import axios from "axios";
import User from "@models/User";
import db from "@utils/db";
import { getUserByProfileName } from "@utils/getUserByProfileName";
import { NextResponse } from "next/server";
import { isE2eCaptchaBypass } from "@/utils/api/e2eTestMode";
import {
  hasSignupFieldErrors,
  validateSignupFields,
  type SignupBody,
  type SignupFieldErrors,
} from "@/utils/api/validateSignupSubmission";

type RecaptchaVerifyResponse = {
  success?: boolean;
  score?: number;
};

async function verifyRecaptchaV3(
  captchaToken: string,
): Promise<NextResponse | null> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const params = new URLSearchParams();
  params.append("secret", secretKey ?? "");
  params.append("response", captchaToken);

  try {
    const captchaRes = await axios.post<RecaptchaVerifyResponse>(
      "https://www.google.com/recaptcha/api/siteverify",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { success, score } = captchaRes.data;
    if (!success || (score ?? 0) < 0.5) {
      return NextResponse.json(
        { message: "Captcha verification failed" },
        { status: 400 },
      );
    }
    return null;
  } catch {
    return NextResponse.json(
      { message: "Captcha verification error" },
      { status: 500 },
    );
  }
}

async function collectAsyncSignupErrors(
  email: string | undefined,
  profileName: string | undefined,
): Promise<SignupFieldErrors> {
  const errors: SignupFieldErrors = {};

  if (profileName) {
    await db.connect();
    const existingUserProfile = await getUserByProfileName(profileName);
    if (existingUserProfile) {
      errors.profilename = "That profile name is already used!";
    }
  }

  if (email) {
    await db.connect();
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      errors.email = "Email is already used!";
    }
  }

  return errors;
}

export async function POST(req: Request) {
  const body = (await req.json()) as SignupBody;
  const { name, email, password, profileName, over13, captchaToken } = body;

  if (!isE2eCaptchaBypass(captchaToken)) {
    if (!captchaToken) {
      return NextResponse.json(
        { message: "Captcha token missing" },
        { status: 400 },
      );
    }

    const captchaError = await verifyRecaptchaV3(captchaToken);
    if (captchaError) return captchaError;
  }

  const errors: SignupFieldErrors = {
    ...validateSignupFields(body),
    ...(await collectAsyncSignupErrors(email, profileName)),
  };

  if (hasSignupFieldErrors(errors)) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const newUser = new User({
    name,
    email,
    profileName: profileName!.toLowerCase(),
    over13,
    ...(password && { password: bcryptjs.hashSync(password) }),
  });

  const user = await newUser.save();

  return NextResponse.json(
    {
      message: "Created user!",
      _id: user._id,
      profileName: user.profileName,
      name: user.name,
      email: user.email,
      over13: user.over13,
    },
    { status: 201 },
  );
}
