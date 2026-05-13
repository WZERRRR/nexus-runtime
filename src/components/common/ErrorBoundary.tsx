import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

type ErrorBoundaryProps = {
  children: ReactNode;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Runtime UI boundary caught an error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[55vh] flex items-center justify-center p-6" dir="rtl">
        <div className="glass-panel max-w-xl w-full rounded-2xl p-6 border border-red-500/20 bg-red-500/[0.03]">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-red-500/10 p-3 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-[var(--text-primary)]">تعذر عرض هذه الصفحة</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                تم عزل الخطأ حتى تبقى لوحة التحكم تعمل. أعد تحميل الصفحة أو انتقل إلى قسم آخر.
              </p>
              {this.state.message && (
                <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-black/5 p-3 text-left text-[11px] text-red-500 dark:bg-black/30">
                  {this.state.message}
                </pre>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-red-500"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة التحميل
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
