type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function isErrorWithResponse(err: unknown): err is ErrorWithResponse {
  return typeof err === "object" && err !== null;
}

export function getError(err: unknown): string {
  if (isErrorWithResponse(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
