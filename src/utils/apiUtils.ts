export class TimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export const fetchWithTimeout = async (
  resource: RequestInfo | URL,
  options: RequestInit = {},
  timeout = 5000,
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const { signal } = controller;

  try {
    const response = await fetch(resource, {
      ...options,
      signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new TimeoutError();
    }
    throw error;
  }
};
