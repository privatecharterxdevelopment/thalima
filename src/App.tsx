import { useLayoutEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { UiProvider } from './ui'
import { StoreProvider, useStore } from './store'
import { Shell } from './components/Shell'
import { Login } from './pages/Login'
import { Bridge } from './pages/Bridge'
import { Board } from './pages/Board'
import { TaskPage } from './pages/TaskPage'
import { Messages } from './pages/Messages'
import { Position } from './pages/Position'
import { Interior } from './pages/Interior'
import { Watch } from './pages/Watch'
import { Logbook } from './pages/Logbook'
import { CrewLayout, CrewMembers } from './pages/Crew'
import { CrewSchedule } from './pages/CrewSchedule'
import { Inventory } from './pages/Inventory'
import { Calendar } from './pages/Calendar'
import { Galley } from './pages/Galley'
import { NewJob } from './pages/NewJob'
import { Cloud } from './pages/Cloud'
import { Maintenance } from './pages/Maintenance'
import { Accounting } from './pages/Accounting'
import { AccountingOverview } from './pages/accounting/Overview'
import { AccountingReceipts } from './pages/accounting/Receipts'
import { AccountingDetail } from './pages/accounting/Detail'
import { AccountingApprovals } from './pages/accounting/Approvals'
import { AccountingReports } from './pages/accounting/Reports'
import { AccountingManual } from './pages/accounting/Manual'
import { AccountingUpload } from './pages/accounting/Upload'
import { Admin } from './pages/Admin'
import { Notifications } from './pages/Notifications'
import { Weather } from './pages/Weather'
import { Landing } from './pages/Landing'
import { Charter } from './pages/Charter'
import { Boat } from './pages/Boat'
import { BrochurePage } from './pages/BrochurePage'
import { Specs } from './pages/Specs'
import { Contact } from './pages/Contact'
import { Privacy } from './pages/Privacy'
import { SiteProvider } from './site'

function Gate({ children }: { children: ReactNode }) {
  const { user, authReady } = useStore()
  if (!authReady) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    if (hash) {
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView()
      })
      return
    }
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.scrollTop = 0
    document.body.scrollTop = 0
    html.style.scrollBehavior = prev
  }, [pathname, hash])
  return null
}

function Public() {
  return (
    <SiteProvider>
      <ScrollTop />
      <Outlet />
    </SiteProvider>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <UiProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<Public />}>
            <Route path="/" element={<Landing />} />
            <Route path="/charter" element={<Charter />} />
            <Route path="/boat" element={<Boat />} />
            <Route path="/brochure" element={<BrochurePage />} />
            <Route path="/specs" element={<Specs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route path="/app" element={<Bridge />} />
            <Route path="/board/:taskId" element={<TaskPage />} />
            <Route path="/board" element={<Board />} />
            <Route path="/new" element={<NewJob />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:channelId" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/position" element={<Position />} />
            <Route path="/interior" element={<Interior />} />
            <Route path="/galley" element={<Galley />} />
            <Route path="/watch" element={<Watch />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/accounting" element={<Accounting />}>
              <Route index element={<AccountingOverview />} />
              <Route path="expenses" element={<AccountingReceipts />} />
              <Route path="expenses/:id" element={<AccountingDetail />} />
              <Route path="receipts" element={<Navigate to="/accounting/expenses" replace />} />
              <Route path="receipts/:id" element={<AccountingDetail />} />
              <Route path="approvals" element={<AccountingApprovals />} />
              <Route path="reports" element={<AccountingReports />} />
              <Route path="new" element={<AccountingManual />} />
              <Route path="upload" element={<AccountingUpload />} />
            </Route>
            <Route path="/engineering" element={<Navigate to="/maintenance?tab=hours" replace />} />
            <Route path="/crew" element={<CrewLayout />}>
              <Route index element={<CrewMembers />} />
              <Route path="schedule" element={<CrewSchedule />} />
            </Route>
            <Route path="/log" element={<Logbook />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/cloud" element={<Cloud />} />
            <Route path="/weather" element={<Weather />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </UiProvider>
    </StoreProvider>
  )
}
