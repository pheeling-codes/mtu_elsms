const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const fetchApi = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }

  return res.json();
};
