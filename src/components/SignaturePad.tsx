import { useEffect, useRef, useState } from 'react'

type Props = {
  onInk: (dataUrl: string) => void
}

export function SignaturePad({ onInk }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasInk = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(rect.width * ratio))
    canvas.height = Math.max(1, Math.round(rect.height * ratio))
    const ctx = canvas.getContext('2d')
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0)
  }, [])

  function stroke(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.strokeStyle = getComputedStyle(canvas).color
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = stroke(e.currentTarget)
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = stroke(e.currentTarget)
    if (!ctx) return
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    hasInk.current = true
    if (!ready) setReady(true)
  }

  function up(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = false
    if (!hasInk.current) {
      onInk('')
      return
    }
    onInk(e.currentTarget.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.save()
    ctx?.setTransform(1, 0, 0, 1, 0, 0)
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    ctx?.restore()
    hasInk.current = false
    setReady(false)
    onInk('')
  }

  return (
    <div className="sign-pad">
      <canvas
        ref={canvasRef}
        className="sign-canvas"
        aria-label="Signature"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      {ready ? null : <span className="sign-hint">Sign here</span>}
      <button type="button" className="sign-clear" onClick={clear}>
        Clear
      </button>
    </div>
  )
}
