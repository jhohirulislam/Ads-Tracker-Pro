import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  name?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ options, value, onChange, placeholder, label, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setSearch(option);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div className="field relative" ref={containerRef}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type="text"
          name={name}
          className={cn(
            "input pr-10 transition-all duration-300",
            isOpen && "ring-2 ring-blue-500/20 border-blue-500"
          )}
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-blue-900/10 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-1 no-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all flex items-center justify-between group",
                      value === option ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                    {value === option && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-xs text-slate-400 mb-3 font-medium">কোনো মিল পাওয়া যায়নি</p>
                  {search && (
                    <button
                      type="button"
                      className="btn btn-primary py-2 px-4 text-[10px] gap-2 mx-auto rounded-xl"
                      onClick={() => setIsOpen(false)}
                    >
                      <Plus className="w-3.5 h-3.5" /> "{search}" হিসেবে যোগ করুন
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
