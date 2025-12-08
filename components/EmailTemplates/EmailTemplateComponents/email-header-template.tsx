import { Container, Heading, Img } from "@react-email/components";

import * as React from "react";

interface EmailHeaderTemplateProps {
  headerText?: string;
  imgLink?: string;
  imgAltText?: string;
}

export const EmailHeaderTemplate = ({
  headerText,
  imgLink,
  imgAltText,
}: EmailHeaderTemplateProps) => (
  <Container style={container}>
    <Heading
      as="h3"
      style={companyname}
    >
      Homeward Tails
    </Heading>
    {imgLink && (
      <Img
        src={imgLink}
        height={140}
        alt={imgAltText}
        style={{
          margin: "0 auto",
          border: "2px solid white",
          //horizontally centers alt text
          textAlign: "center",
          color: "white",
        }}
      />
    )}

    <Heading style={heading}> {headerText} </Heading>
  </Container>
);

export default EmailHeaderTemplate;

EmailHeaderTemplate.PreviewProps = {
  headerText: "Test Header",
  imgLink: "https://media1.tenor.com/m/RFMH39za-H4AAAAd/press-the-pack.gif",
  imgAltText:
    "image of a dog with sunglasses clicking a button which turns on a green lightbulb",
} as EmailHeaderTemplateProps;

const container = {
  margin: "0 auto",
  backgroundColor: "rgba(80,30,200,1)",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  textAlign: "center" as "center",
  backgroundImage: `url("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwgcQvnGvXImnEEIBManBL1e94rk9Qk9DfLw&s")`,
  backgroundRepeat: "none",
  backgroundSize: "cover",
};

const heading = {
  fontSize: "20px",
  fontWeight: "bold",
  margin: "20px auto",
  color: "white",
};

const companyname = {
  color: "white",
  fontSize: "1.4rem",
  background: "rgba(124,58,237,1)",
  padding: "12px 0",
  border: "0px",
};
