import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <button
              onClick={onCancel}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
