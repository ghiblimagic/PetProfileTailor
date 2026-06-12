import { Link, Text } from "@react-email/components";

import * as React from "react";

interface EmailButtonTemplateProps {
  buttonHref?: string;
  buttonText?: string;
}

export const EmailButtonTemplate = ({
  buttonHref,
  buttonText,
}: EmailButtonTemplateProps) => (
  <Link
    style={link}
    href={buttonHref}
  >
    👉
    <Text style={button}>{buttonText}</Text> 👈
  </Link>
);

export default EmailButtonTemplate;

EmailButtonTemplate.PreviewProps = {
  buttonHref: "magiclink",
  buttonText: "Click to sign in",
} as EmailButtonTemplateProps;

const link = {
  color: "#FF6363",
};

const button = {
  background: "rgba(124,58,237,1)",
  backgroundSize: "auto 90px",
  borderRadius: "20px",
  color: "#fff",
  display: "inline-block",
  margin: "0 10px",
  padding: "14px 2em",
};
