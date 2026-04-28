const DEFAULT_AGENT_URL = process.env.NEXT_PUBLIC_LOCAL_AGENT_URL || "http://localhost:8765"

export function getAgentBaseUrl() {
  return DEFAULT_AGENT_URL.replace(/\/$/, "")
}

export function getAgentUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getAgentBaseUrl()}${normalizedPath}`
}

export async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getAgentUrl(path), {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Agent request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
