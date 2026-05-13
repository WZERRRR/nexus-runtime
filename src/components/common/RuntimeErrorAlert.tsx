import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface RuntimeErrorAlertProps {
  error: string | null;
  onRetry?: () => void;
  title?: string;
  isFatal?: boolean;
}

export const RuntimeErrorAlert: React.FC<RuntimeErrorAlertProps> = ({ 
  error, 
  onRetry, 
  title = "Operational Sync Failure",
  isFatal = false 
}) => {
  if (!error) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full p-4 rounded-xl border relative overflow-hidden backdrop-blur-xl ${
        isFatal ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none ${
        isFatal ? 'bg-red-500' : 'bg-orange-500'
      }`} />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-2 rounded-lg border ${
          isFatal ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'
        }`}>
          {isFatal ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-black uppercase tracking-widest mb-1 ${
            isFatal ? 'text-red-400' : 'text-orange-400'
          }`}>{title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{error}</p>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className={`mt-4 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all active:scale-95 border shadow-sm ${
                isFatal 
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30' 
                  : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-orange-500/30'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تنشيط التعافي (Recover)
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
