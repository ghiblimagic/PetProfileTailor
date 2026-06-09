import bcryptjs from "bcryptjs";
import User from "@models/User";
import db from "@utils/db";
import regexInvalidInput from "@/utils/stringManipulation/check-for-valid-content";
import { getUserByProfileName } from "@utils/getUserByProfileName";
import { NextResponse } from "next/server";
import { createSecretKey } from "crypto";
import axios from "axios";

export async function POST(req) {
  const body = await req.json();
  const { name, email, password, profileName, over13, captchaToken } = body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Google reCAPTCHA v3 expects the verification request to be form-encoded POST data, not query parameters (even though GET sometimes works, it’s unreliable).
  const params = new URLSearchParams();
  params.append("secret", secretKey);
  params.append("response", captchaToken);

  const e2eBypass =
    process.env.E2E_TEST_MODE === "true" &&
    captchaToken === "e2e-bypass";

  // ############ Verify reCAPTCHA v3 ###############
  if (!e2eBypass) {
    if (!captchaToken) {
      return NextResponse.json(
        { message: "Captcha token missing" },
        { status: 400 },
      );
    }

    try {
      const captchaRes = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        params.toString(), // send as form-encoded string
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { success, score } = captchaRes.data;
      if (!success || score < 0.5) {
        return NextResponse.json(
          { message: "Captcha verification failed" },
          { status: 400 },
        );
      }
    } catch (err) {
      return NextResponse.json(
        { message: "Captcha verification error" },
        { status: 500 },
      );
    }
  }

  const errors = {};

  // ############  Basic required field validation ###############
  if (!name) errors.name = "Please enter a name";
  if (!email) errors.email = "Please enter an email";
  if (email && !email.includes("@"))
    errors.email = "Please enter a valid email";
  if (!profileName) errors.profilename = "Please enter a profile name";
  if (!over13) errors.over13 = "You must confirm you are over 13";

  // ############ Profile name checks ###############
  if (profileName) {
    const invalidProfileNameInput = regexInvalidInput(profileName);
    if (invalidProfileNameInput != null) {
      errors.profilename = `Invalid characters entered: ${invalidProfileNameInput}`;
    }

    await db.connect();
    const existingUserProfile = await getUserByProfileName(profileName);
    if (existingUserProfile) {
      errors.profilename = "That profile name is already used!";
    }
  }

  // ############ Password checks ###############
  if (password && password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  // ############ Email uniqueness ###############
  if (email) {
    await db.connect();
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      errors.email = "Email is already used!";
    }
  }

  // ############ Return all errors if any ###############
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // ############ Create user ###############
  const newUser = new User({
    name,
    email,
    profileName: profileName.toLowerCase(),
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

// import bcryptjs from "bcryptjs";
// import User from "@models/User";
// import db from "@utils/db";
// import regexInvalidInput from "@utils/stringManipulation/check-for-valid-names";
// import { getUserByProfileName } from "@utils/getUserByProfileName";

// async function handler(req, res) {
//   if (req.method !== "POST") {
//     return;
//   }
//   const { name, email, password, profileName } = req.body;

//   const errors = {};

//   // ############  Basic required field validation ###############
//   if (!name) errors.name = "Please enter a name";
//   if (!email) errors.email = "Please enter an email";
//   if (email && !email.includes("@"))
//     errors.email = "Please enter a valid email";
//   if (!profileName) errors.profilename = "Please enter a profile name";

//   // ############ Profile name checks ###############
//   if (profileName) {
//     const invalidProfileNameInput = regexInvalidInput(profileName);
//     if (invalidProfileNameInput != null) {
//       errors.profilename = `Invalid characters entered: ${invalidProfileNameInput}`;
//     }

//     const existingUserProfile = await getUserByProfileName(profileName);
//     if (existingUserProfile) {
//       errors.profilename = "That profile name is already used!";
//     }
//   }

//   // ############ Password checks ###############
//   const passwordChecked = password === "" ? null : password;

//   if (passwordChecked != null && passwordChecked.length < 5) {
//     errors.password = "Password must be at least 6 characters";
//   }

//   // ############ Email uniqueness ###############
//   if (email) {
//     await db.connect();
//     const existingEmail = await User.findOne({ email });
//     if (existingEmail) {
//       errors.email = "Email is already used!";
//     }

//     // ############ Return all errors at once if any ###############
//     if (Object.keys(errors).length > 0) {
//       return res.status(422).json({ errors });
//     }
//   }

//   // ############ Proceed to create user ###############

//   const newUser = new User({
//     name,
//     email,
//     profileName: profileName.toLowerCase(),
//     ...(passwordChecked != null && {
//       password: bcryptjs.hashSync(passwordChecked),
//     }),
//   });

//   // https://www.freecodecamp.org/news/how-to-conditionally-build-an-object-in-javascript-with-es6-e2c49022c448/

//   const user = await newUser.save();

//   res.status(201).send({
//     message: "Created user!",
//     _id: user._id,
//     profileName: user.profileName,
//     name: user.name,
//     email: user.email,
//   });
// }

// export default handler;
