import axios from "axios";

type ErrorEnvelope = {
  error?: {
    message?: string;
  };
};

export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ErrorEnvelope>(error)) {
    const apiMessage = error.response?.data?.error?.message;

    if (apiMessage) {
      return apiMessage;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
