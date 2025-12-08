import GeneralButton from "@components/ReusableSmallComponents/buttons/GeneralButton";
import LinkButton from "@components/ReusableSmallComponents/buttons/LinkButton";
import ListWithPawPrintIcon from "@components/ReusableSmallComponents/ListWithPawPrintIcon";
import Image from "next/image";

const MediaObjectRight = ({
  image,
  listOfText,
  buttonText,
  buttonTextLink,

  alttext,
  imgwidth,
  imgheight,
  credit,
  creditLink,
  buttonStyle,
}) => {
  return (
    <div className="flex justify-center my-6 flex-col md:flex-row sm:ml-2">
      <div
        className="max-w-md ml-4 mr-8 self-center 
    "
      >
        <ul className="text-base md:text-lg text-white pb-8 ">
          {listOfText.map((sentence) => (
            <ListWithPawPrintIcon
              text={sentence}
              key={sentence}
            />
          ))}
        </ul>

        <div className="flex items-center mb-4">
          {buttonText && buttonStyle === "subtle" ? (
            <LinkButton
              href={buttonTextLink}
              text={buttonText}
              subtle
            />
          ) : (
            <LinkButton
              href={buttonTextLink}
              text={buttonText}
              defaultStyle
            />
          )}
        </div>
      </div>
      <div
        className="self-center w-80 
     "
      >
        <Image
          className=""
          width={imgwidth}
          height={imgheight}
          src={image}
          alt={alttext}
          sizes="100vw"
          style={{
            maxWidth: "100%",
            width: "auto",
            height: "auto",
          }}
        />

        {credit && (
          <small className="text-subtleWhite">
            {credit}
            <a href={creditLink}> - clickable link </a>
          </small>
        )}
      </div>
    </div>
  );
};
export default MediaObjectRight;
