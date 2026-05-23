import React, { createContext, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface PromptDialogState {
  isOpen: boolean;
  message: string;
  defaultValue?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

interface UIContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  showPrompt: (message: string, onSubmit: (value: string | null) => void, defaultValue?: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmDialogState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [promptState, setPromptState] = useState<PromptDialogState>({
    isOpen: false,
    message: '',
    onSubmit: () => {},
    onCancel: () => {},
  });
  const [promptValue, setPromptValue] = useState('');

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showPrompt = (message: string, onSubmit: (value: string | null) => void, defaultValue: string = '') => {
    setPromptValue(defaultValue);
    setPromptState({
      isOpen: true,
      message,
      onSubmit: (value) => {
        onSubmit(value);
        setPromptState(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        onSubmit(null);
        setPromptState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <UIContext.Provider value={{ showToast, showConfirm, showPrompt }}>
      {children}
      
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: toast.type === 'error' ? 'var(--color-danger)' : toast.type === 'success' ? 'var(--color-success)' : 'var(--color-gray-800)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '200px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{toast.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '10px' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', minWidth: '320px', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-gray-900)' }}>Confirmação</h3>
            <p style={{ color: 'var(--color-gray-700)' }}>{confirmState.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={confirmState.onCancel}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmState.onConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog */}
      {promptState.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', minWidth: '320px', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-gray-900)' }}>Entrada Requerida</h3>
            <p style={{ color: 'var(--color-gray-700)' }}>{promptState.message}</p>
            <form onSubmit={(e) => { e.preventDefault(); promptState.onSubmit(promptValue); }}>
              <input 
                autoFocus
                type="text" 
                className="input" 
                value={promptValue} 
                onChange={e => setPromptValue(e.target.value)} 
                style={{ width: '100%', marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={promptState.onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
