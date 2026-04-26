'use server'

import { redirect } from 'next/navigation'

export async function refreshHistory(path: string) {
  redirect(path)
}

/**
 * Returns any missing required environment variables for the frontend.
 * Note: GROQ_API_KEY is now only required by the Python backend,
 * so we check for NEXT_PUBLIC_BACKEND_URL if it's explicitly required.
 */
export async function getMissingKeys() {
  // Backend URL defaults to localhost:8000 if not set — no hard requirement
  return []
}
