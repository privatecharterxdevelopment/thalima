import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store'

export function Login() {
  const { signIn, user, authReady } = useStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const prev = document.title
    html.classList.add('is-gate')
    document.title = 'Sign in · Thalima'
    return () => {
      html.classList.remove('is-gate')
      document.title = prev
    }
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    el.defaultMuted = true
    el.controls = false
    el.playsInline = true
    const tryPlay = () => {
      el.controls = false
      void el.play().catch(() => {})
    }
    tryPlay()
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('playing', () => {
      el.controls = false
    })
    return () => {
      el.removeEventListener('loadeddata', tryPlay)
    }
  }, [])

  if (!authReady) return null
  if (user) return <Navigate to={user.access === 'owner' ? '/admin' : '/app'} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const fail = await signIn(email, password, remember)
    setBusy(false)
    if (fail) setError(fail)
  }

  return (
    <div className="gate">
      <section className="gate-card">
        <div className="gate-form">
          <Link className="gate-brand" to="/" aria-label="Thalima">
            <img src="/logo.png" alt="Thalima" />
          </Link>
          <h1>Welcome aboard.</h1>
          <p className="gate-lead">Crew ops for Thalima. Sign in with your seat.</p>
          <form onSubmit={(e) => void onSubmit(e)}>
            <label className="gate-field">
              Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="max@thalima.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                required
              />
            </label>
            <label className="gate-field">
              Password
              <span className="gate-pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  required
                />
                <button
                  type="button"
                  className="gate-eye"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
                </button>
              </span>
            </label>
            {error && <p className="gate-err">{error}</p>}
            <label className="gate-check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button className="gate-go" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="gate-hint">
            Owner: <code>owner@thalima.com</code> / <code>thalima</code> is master admin. Crew: first name lowercase,
            padded to 6 characters with 1.
          </p>
        </div>
        <div className="gate-media" aria-hidden="true">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            poster="/yacht/login.jpg"
            tabIndex={-1}
          >
            <source src="/yacht/login.mp4" type="video/mp4" />
          </video>
          <img className="gate-mark" src="/mark.png" alt="" />
        </div>
      </section>
    </div>
  )
}
