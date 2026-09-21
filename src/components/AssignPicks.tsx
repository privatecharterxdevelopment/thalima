import { crew } from '../data/crew'

export function AssignPicks({
  value,
  onChange,
}: {
  value: string[]
  onChange: (ids: string[]) => void
}) {
  return (
    <div className="assign-picks">
      {crew.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            className={on ? 'on' : ''}
            onClick={() => {
              if (on) {
                if (value.length < 2) return
                onChange(value.filter((id) => id !== c.id))
                return
              }
              onChange([...value, c.id])
            }}
          >
            {c.name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}
