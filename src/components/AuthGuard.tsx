import React, { useState, useEffect, createContext, useContext } from 'react';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

export const AuthContext = createContext<{ lockBoard: () => void }>({ lockBoard: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const PIN_KEY = 'taskflow_pin';

  useEffect(() => {
    // Check if chrome.storage is available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([PIN_KEY], (result) => {
        if (result[PIN_KEY]) {
          setSavedPin(result[PIN_KEY] as string);
        }
        setIsLoading(false);
      });
    } else {
      // Fallback for local dev testing without extension environment
      const localPin = localStorage.getItem(PIN_KEY);
      if (localPin) {
        setSavedPin(localPin);
      }
      setIsLoading(false);
    }
  }, []);

  const handlePinInput = (num: string) => {
    setError('');
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (!savedPin) {
      // Setup new PIN
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [PIN_KEY]: pin }, () => {
          setSavedPin(pin);
          setIsUnlocked(true);
          setPin('');
        });
      } else {
        localStorage.setItem(PIN_KEY, pin);
        setSavedPin(pin);
        setIsUnlocked(true);
        setPin('');
      }
    } else {
      // Verify PIN
      if (pin === savedPin) {
        setIsUnlocked(true);
        setPin('');
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  // Allow enter key to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnlocked || isLoading) return;
      if (e.key >= '0' && e.key <= '9') {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isUnlocked, isLoading, savedPin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <AuthContext.Provider value={{ lockBoard: () => setIsUnlocked(false) }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            {savedPin ? <Lock size={32} /> : <ShieldAlert size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {savedPin ? 'Board Locked' : 'Secure Your Board'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
            {savedPin ? 'Enter your 4-digit PIN to access tasks' : 'Create a 4-digit PIN to secure your data'}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                pin.length > i 
                  ? 'bg-blue-600 dark:bg-blue-400 scale-110' 
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-6 font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePinInput(num.toString())}
              className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xl font-semibold rounded-xl transition-colors active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-slate-500 dark:text-slate-400 text-lg font-medium rounded-xl transition-colors active:scale-95"
          >
            CLR
          </button>
          <button
            onClick={() => handlePinInput('0')}
            className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xl font-semibold rounded-xl transition-colors active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            className="h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl transition-colors active:scale-95 flex items-center justify-center"
          >
            {savedPin ? <Unlock size={24} /> : 'SET'}
          </button>
        </div>
      </div>
    </div>
  );
}
