"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getError } from "@utils/error";
import axios from "axios";
import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ImageUpload from "@components/AddingNewData/ImageUpload";
import RegisterInput from "@components/FormComponents/RegisterInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SmallCenteredHeading from "@/components/ReusableSmallComponents/TitlesOrHeadings/SmallCenteredheading";

export default function ProfileScreen() {
  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  const [isSaving, setIsSaving] = useState(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session?.user) {
      return;
    }
    setValue("name", session.user.name);
    setValue("userid", session.user.id);
  }, [session.user, setValue]);

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || !session?.user) {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    return null; // redirect is in progress
  }

  const submitHandler = async ({ name, email, password, userid }) => {
    setIsSaving(true);
    try {
      await axios.put("/api/auth/update", {
        name,
        email,
        password,
        userid,
      });
      toast.success("Profile updated successfully");
      setIsSaving(false);
    } catch (err) {
      toast.error(getError(err));
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="h-fit w-40 mx-auto mb-4 ">
        <Image
          className="rounded-full"
          src="/sunglasseseditsettingsdog.jpg"
          width={160}
          height={160}
          alt="Image of a small dog looking relaxed and wearing sunglasses"
          sizes="100vw"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "cover",
          }}
        />
      </div>
      <div className=" mx-auto  text-center max-w-3xl">
        <form onSubmit={handleSubmit(submitHandler)}>
          <SmallCenteredHeading
            heading="Update Profile"
            level="1"
          />

          <p className="text-white text-center py-2">
            You can change your name, email and/or password
          </p>
          <RegisterInput
            id="name"
            label="Name"
            maxLength={30}
            autoFocus
            register={register}
            validation={{ required: "Please enter a name" }}
            error={errors.name}
            disabled={isSaving}
          />

          <RegisterInput
            id="email"
            label="Email"
            type="email"
            register={register}
            validation={{
              required: "Please enter email",
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/i,
                message: "Please enter valid email",
              },
            }}
            error={errors.email}
            disabled={isSaving}
          />
          <RegisterInput
            id="password"
            label="New Password"
            type="password"
            register={register}
            validation={{
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            }}
            error={errors.password}
            disabled={isSaving}
          />

          <RegisterInput
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            register={register}
            validation={{
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
              minLength: {
                value: 6,
                message: "Confirm password must be at least 6 characters",
              },
            }}
            error={errors.confirmPassword}
            disabled={isSaving}
          />

          <div className="mb-4 w-full text-center">
            <GeneralButton
              text="Update Profile"
              disabled={isSaving}
            />
          </div>
        </form>
        <ImageUpload />
      </div>
    </div>
  );
}

ProfileScreen.auth = true;
