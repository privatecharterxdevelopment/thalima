import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import { Shell } from './components/Shell'
import { Login } from './pages/Login'
import { Bridge } from './pages/Bridge'
import { Board } from './pages/Board'
import { Messages } from './pages/Messages'
import { Position } from './pages/Position'
import { Engineering } from './pages/Engineering'
import { Interior } from './pages/Interior'
import { Watch } from './pages/Watch'
import { Logbook } from './pages/Logbook'

function Gate({ children }: { children: ReactNode }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route path="/" element={<Bridge />} />
            <Route path="/board" element={<Board />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:channelId" element={<Messages />} />
            <Route path="/position" element={<Position />} />
            <Route path="/engineering" element={<Engineering />} />
            <Route path="/interior" element={<Interior />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/log" element={<Logbook />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
