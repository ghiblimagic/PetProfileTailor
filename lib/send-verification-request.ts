import { SendVerificationRequestParams } from "next-auth/providers";
import { Resend } from "resend";
import { MagicLinkTemplate } from "@components/EmailTemplates/magic-link-template";
import db from "@/utils/db";
import User from "@/models/User";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationRequest = async (
  params: SendVerificationRequestParams,
) => {
  let { identifier: email, url, provider } = params;

  try {
    await db.connect();

    // Check if the user exists
    const userExists = await User.findOne({ email });

    // If user doesn't exist, don't send an email — just exit silently.
    if (!userExists) {
      console.log(`[MagicLink] No user found for ${email}, skipping email.`);
      return;
    }

    await resend.emails.send({
      from: `${process.env.RESEND_EMAIL_FROM}`,
      to: email,
      subject: "Login Link to your Account",
      react: MagicLinkTemplate({
        magicLink: url,
        email,
      }),
    });
  } catch (error) {
    console.error({ error });
  }
};

// to: ["janetspellman13@gmail.com"],
// from: "onboarding@resend.dev",
// subject: `Sign in to ${host}`,
// react: MagicLinkTemplate({
//   magicLink: "testing",
// }),
// });
// },
