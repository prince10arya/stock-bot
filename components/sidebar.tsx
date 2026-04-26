'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarCloseIcon, SidebarOpenIcon } from 'lucide-react'
import { listChats, deleteChat } from '@/lib/chat/actions'
import type { ChatListItem } from '@/lib/types'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const params = useParams()
  const router = useRouter()
  const chatId = params?.id as string

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      listChats()
        .then((data) => setChats(data))
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }
  }, [open, chatId])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await deleteChat(id)
      setChats(chats.filter((c) => c.id !== id))
      if (chatId === id) {
        router.push('/')
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <SidebarOpenIcon className="size-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      {/* For desktop, we can show a trigger button in the header too */}
      <div className="hidden md:flex">
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <SidebarCloseIcon className="size-5" /> : <SidebarOpenIcon className="size-5" />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-background/95 backdrop-blur-md">
        <SheetHeader className="p-4 border-b border-border text-left">
          <SheetTitle className="font-serif text-lg text-foreground">Chat History</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
          ) : chats?.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No chat history.</div>
          ) : (
            chats?.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg text-sm transition-colors',
                  chatId === chat.id
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <div className="flex-1 truncate pr-2">
                  {chat.title || 'New Chat'}
                </div>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  title="Delete chat"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
                    <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4V12H10V4H5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </Link>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
