import { Chat } from '@/components/chat'
import { getMissingKeys } from '@/app/actions'

export const metadata = {
  title: 'StockBot powered by Groq'
}

export default async function IndexPage() {
  const missingKeys = await getMissingKeys()
  return <Chat missingKeys={missingKeys} />
}
