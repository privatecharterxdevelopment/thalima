import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Ui = {
  taskId: string | null
  bell: boolean
  navFull: boolean
  menuOpen: boolean
  openTask: (id: string) => void
  closeTask: () => void
  setBell: (v: boolean) => void
  setNavFull: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
}

const Ctx = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [bell, setBell] = useState(false)
  const [navFull, setNavFull] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const openTask = useCallback((id: string) => {
    setBell(false)
    setTaskId(id)
  }, [])

  const closeTask = useCallback(() => setTaskId(null), [])

  const value = useMemo(
    () => ({
      taskId,
      bell,
      navFull,
      menuOpen,
      openTask,
      closeTask,
      setBell,
      setNavFull,
      setMenuOpen,
    }),
    [taskId, bell, navFull, menuOpen, openTask, closeTask],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUi() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ui')
  return ctx
}
