'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { IconMoon, IconSun } from '@/components/ui/icons'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = React.useTransition()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      size="icon"
      variant="outline"
      style={{ borderRadius: 0 }}
      onClick={() => {
        startTransition(() => {
          setTheme(theme === 'light' ? 'dark' : 'light')
        })
      }}
    >
      {mounted ? (
        theme === 'dark' ? (
          <IconMoon className="transition-all" />
        ) : (
          <IconSun className="transition-all" />
        )
      ) : (
        <span className="size-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
