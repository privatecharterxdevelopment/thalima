export function SectionTabs<T extends string>({
  value,
  onChange,
  tabs,
  variant = 'tabs',
}: {
  value: T
  onChange: (id: T) => void
  tabs: { id: T; label: string }[]
  variant?: 'tabs' | 'pills'
}) {
  return (
    <div className={variant === 'pills' ? 'filters' : 'ops-views page-tabs'}>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={value === tab.id ? 'on' : ''} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
