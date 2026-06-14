import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import RegisterForm from "./RegisterForm";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
  signIn: vi.fn(),
}));

vi.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: vi.fn() }),
}));

vi.mock("react-google-recaptcha", () => ({
  default: () => <div data-testid="recaptcha-v2" />,
}));

vi.mock("@/utils/api/e2eTestMode", () => ({
  isE2eClientMode: () => true,
  E2E_CAPTCHA_BYPASS_TOKEN: "e2e-bypass",
}));

vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mocks = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  isAxiosError: vi.fn(),
}));

vi.mock("axios", () => ({
  default: { post: mocks.axiosPost },
  isAxiosError: mocks.isAxiosError,
}));

async function fillRegisterForm(
  user: ReturnType<typeof userEvent.setup>,
  {
    name = "Test User",
    profilename = "testuser",
    email = "test@example.com",
    password = "",
    confirmPassword = "",
    over13 = true,
  } = {},
) {
  if (over13) {
    await user.click(
      screen.getByRole("checkbox", { name: /over 13 years old/i }),
    );
  }
  await user.clear(screen.getByLabelText(/user name/i));
  await user.type(screen.getByLabelText(/user name/i), name);
  await user.clear(screen.getByLabelText(/profile name/i));
  await user.type(screen.getByLabelText(/profile name/i), profilename);
  await user.clear(screen.getByLabelText(/^email$/i));
  await user.type(screen.getByLabelText(/^email$/i), email);
  if (password) {
    await user.type(screen.getByLabelText(/^password$/i), password);
  }
  if (confirmPassword) {
    await user.type(
      screen.getByLabelText(/confirm password/i),
      confirmPassword,
    );
  }
}

async function submitRegister(user: ReturnType<typeof userEvent.setup>) {
  const form = document.querySelector("form");
  if (form) form.noValidate = true;
  await user.click(screen.getByRole("button", { name: /register/i }));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders core fields and over-13 checkbox", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("heading", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/user name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profile name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /over 13 years old/i }),
    ).toBeInTheDocument();
  });

  it("requires over-13 confirmation on submit", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillRegisterForm(user, { over13: false });
    await submitRegister(user);

    expect(
      await screen.findByText("You must confirm you are over 13"),
    ).toBeInTheDocument();
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it("rejects invalid profile name characters", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillRegisterForm(user, { profilename: "bad_name" });
    await submitRegister(user);

    expect(
      await screen.findByText(/Invalid characters entered/i),
    ).toBeInTheDocument();
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillRegisterForm(user, {
      password: "secret12",
      confirmPassword: "secret99",
    });
    await submitRegister(user);

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it("rejects invalid email format", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillRegisterForm(user, { email: "not-an-email" });
    await submitRegister(user);

    expect(
      await screen.findByText("Please enter a valid email"),
    ).toBeInTheDocument();
    expect(mocks.axiosPost).not.toHaveBeenCalled();
  });

  it("maps server profile name errors onto the field", async () => {
    const user = userEvent.setup();
    mocks.isAxiosError.mockReturnValue(true);
    mocks.axiosPost.mockRejectedValue({
      response: {
        data: {
          errors: { profilename: "That profile name is already used!" },
        },
      },
    });

    render(<RegisterForm />);
    await fillRegisterForm(user);
    await submitRegister(user);

    expect(
      await screen.findByText("That profile name is already used!"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.axiosPost).toHaveBeenCalledWith(
        "/api/auth/signup",
        expect.objectContaining({
          profileName: "testuser",
          captchaToken: "e2e-bypass",
        }),
      );
    });
  });
});
