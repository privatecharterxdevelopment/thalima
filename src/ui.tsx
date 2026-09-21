import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Ui = {
  bell: boolean
  navFull: boolean
  menuOpen: boolean
  setBell: (v: boolean) => void
  setNavFull: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
}

const Ctx = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [bell, setBell] = useState(false)
  const [navFull, setNavFull] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const value = useMemo(
    () => ({
      bell,
      navFull,
      menuOpen,
      setBell,
      setNavFull,
      setMenuOpen,
    }),
    [bell, navFull, menuOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUi() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ui')
  return ctx
}
