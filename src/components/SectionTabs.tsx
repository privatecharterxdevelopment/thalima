export function SectionTabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T
  onChange: (id: T) => void
  tabs: { id: T; label: string }[]
}) {
  return (
    <div className="filters">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={value === tab.id ? 'on' : ''} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
