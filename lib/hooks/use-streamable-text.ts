import { useEffect, useState } from 'react'

/**
 * Simple hook that returns string content as-is.
 * Previously handled StreamableValue from ai/rsc — now just a passthrough
 * since all streaming is done via SSE in the Chat component.
 */
export const useStreamableText = (content: string): string => {
  return content
}
