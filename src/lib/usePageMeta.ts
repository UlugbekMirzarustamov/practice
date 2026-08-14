import { useEffect } from 'react'

interface PageMetaOptions {
  title: string
  description?: string
}

/** Sets document.title and the meta description while a screen is mounted, restoring the previous values on unmount. */
export function usePageMeta({ title, description }: PageMetaOptions): void {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    const descTag = description ? document.querySelector('meta[name="description"]') : null
    const prevDescription = descTag?.getAttribute('content') ?? null
    if (descTag && description) descTag.setAttribute('content', description)

    return () => {
      document.title = prevTitle
      if (descTag && prevDescription !== null) descTag.setAttribute('content', prevDescription)
    }
  }, [title, description])
}
