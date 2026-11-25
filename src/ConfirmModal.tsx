import { AlertTriangle, X } from 'lucide-react'

export type ConfirmModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning'
  busy?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Yes, Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const confirmBtnClass =
    tone === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
      : 'bg-[#D50C2F] hover:bg-[#b80927] text-white'

  const iconWrapClass =
    tone === 'warning'
      ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
      : 'bg-rose-500/15 border-rose-400/35 text-rose-400'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-[#0B1120] via-[#13203A] to-[#0B1120] border border-slate-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.65)] p-6 text-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconWrapClass}`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${confirmBtnClass}`}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
