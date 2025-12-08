import LinkButton from "../ReusableSmallComponents/buttons/LinkButton";

export default function ErrorContactMessage() {
  return (
    <div className="text-center text-white bg-secondary max-w-4xl mx-auto h-content py-8 my-6 sm:px-2 rounded-2xl">
      <p className="justify-center mb-4">
        You can try to reload the page to see if the error resolves
      </p>

      <h4 className="my-4">Or contact me:</h4>

      <LinkButton
        href="/contact"
        text="contact form"
        className="py-2"
        subtle
      />
    </div>
  );
}
