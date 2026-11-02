export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}


export async function fetchTextWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
  maxChars = 100000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    return text.length > maxChars ? text.slice(0, maxChars) : text;
  } finally {
    clearTimeout(timer);
  }
}
