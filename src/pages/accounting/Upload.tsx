import { useNavigate } from 'react-router-dom'
import { ReceiptCapture } from '../../components/ReceiptCapture'
import { canSubmitAccounting } from '../../lib/accounting'
import { useStore } from '../../store'

export function AccountingUpload() {
  const { user, addReceipt } = useStore()
  const nav = useNavigate()
  if (!user) return null
  if (!canSubmitAccounting(user)) return null

  return (
    <div className="acct-body">
      <section className="acct-card acct-upload">
        <h2>Scan / Upload receipt</h2>
        <p>
        Photograph the docket or attach an image or PDF. Review the fields before submitting — AI extraction is
        prepared, not invented.
        </p>
        <ReceiptCapture
          onFile={(file) => {
            const id = addReceipt(file)
            nav(`/accounting?review=${id}`)
          }}
        />
      </section>
    </div>
  )
}
