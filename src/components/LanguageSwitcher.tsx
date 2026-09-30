import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/i18nContext';
import { LanguageCode } from '../i18n/types';

interface LanguageSwitcherProps {
  variant?: 'header' | 'modal' | 'inline';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { currentLanguage, setLanguage, availableLanguages, currentLanguageInfo } = useI18n();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'modal') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
        {availableLanguages.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-100 block">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lang.name} ({lang.code.toUpperCase()})
                    </span>
                  </div>
                </div>
                {isSelected ? (
                  <span className="h-5 w-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full border border-slate-700 group-hover:border-slate-500" />
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-cyan-400/80">
                {lang.hub}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
          isOpen
            ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50 shadow-sm'
            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
        }`}
        title={`Current Language: ${currentLanguageInfo.nativeName} (${currentLanguageInfo.hub}). Click to change.`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
        <span className="text-sm leading-none shrink-0" role="img" aria-hidden="true">
          {currentLanguageInfo.flag}
        </span>
        <span className="font-bold text-slate-200">
          {currentLanguage.toUpperCase()}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language selection"
          className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl divide-y divide-slate-800/50"
        >
          <div className="px-2.5 py-1.5 pb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Manufacturing Locale / 言語
            </span>
          </div>

          <div className="py-1 space-y-0.5 max-h-72 overflow-y-auto">
            {availableLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 font-bold border border-cyan-800/50'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate text-slate-200">
                          {lang.nativeName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lang.code.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate group-hover:text-cyan-400 transition-colors">
                        {lang.hub}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-cyan-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
