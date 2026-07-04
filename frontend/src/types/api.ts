export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: ErrorDetail | null;
}
