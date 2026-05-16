import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';

function useIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/**
 * Drop-in replacement for Select that uses a bottom-sheet Drawer on mobile.
 * Props: value, onValueChange, placeholder, options: [{value, label}], triggerClassName, children (optional label slot)
 */
export default function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName = '', disabled }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabel || placeholder || 'Select...'}
        </span>
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-base">{placeholder || 'Select an option'}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-safe px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors
                  ${value === o.value
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'hover:bg-gray-50 text-gray-800 border border-transparent'
                  }`}
              >
                {o.label}
                {value === o.value && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}