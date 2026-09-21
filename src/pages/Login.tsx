import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { crew } from '../data/crew'
import { useStore } from '../store'

const DEMO_PASSWORD = 'thalima'

function firstName(name: string) {
  return name.split(' ')[0].toLowerCase()
}

function seatFor(email: string, password: string) {
  const person = crew.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
  if (!person) return null
  const key = password.trim().toLowerCase()
  if (key !== firstName(person.name) && key !== DEMO_PASSWORD) return null
  return person
}

export function Login() {
  const { login, user } = useStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

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

  if (user) return <Navigate to="/app" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const person = seatFor(email, password)
    if (!person) {
      setError('Wrong email or password.')
      return
    }
    login(person.id, remember)
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
          <form onSubmit={onSubmit}>
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
                  placeholder="Your first name"
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
            <button className="gate-go" type="submit">
              Sign in
            </button>
          </form>
          <p className="gate-hint">
            Dummy seats use the crew email. Password is the first name, lowercase — or <code>thalima</code>.
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
