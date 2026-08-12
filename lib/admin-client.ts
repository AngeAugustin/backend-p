export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || `Request failed (${response.status})`
    );
  }

  return response.json() as Promise<T>;
}

export async function adminUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const payload = body as { error?: string; details?: string };
    throw new Error(
      payload.details || payload.error || `Upload failed (${response.status})`
    );
  }

  const body = (await response.json()) as { data: T };
  return body.data;
}
