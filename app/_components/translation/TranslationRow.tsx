import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Pencil, Check, X, AlertTriangle } from "lucide-react";
import TranslationPreview from './TranslationPreview';

function extractVariables(text: string) {
  const matches = text.match(/\{[^}]+\}/g);
  return matches ? matches.sort() : [];
}

type TranslationRowProps = {
  translationKey: string;
  value: string;
  onSave: (key: string, value: string) => void;
};

export default function TranslationRow({ translationKey, value, onSave }: TranslationRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = () => {
    setEditValue(value);
    setWarning('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setWarning('');
  };

  const handleSave = () => {
    const originalVars = extractVariables(value);
    const newVars = extractVariables(editValue);
    
    if (JSON.stringify(originalVars) !== JSON.stringify(newVars)) {
      setWarning('Uwaga: zmienne dynamiczne {…} zostały zmienione! Upewnij się, że to zamierzone.');
      return;
    }
    
    onSave(translationKey, editValue);
    setEditing(false);
    setWarning('');
  };

  const forceSave = () => {
    onSave(translationKey, editValue);
    setEditing(false);
    setWarning('');
  };

  const parts = translationKey.split('.');
  const shortKey = parts[parts.length - 1];
  const path = parts.slice(0, -1).join(' › ');

  return (
    <div className="group border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
      <div className="flex items-start gap-4 px-4 py-3 sm:px-6">
        {/* Key info */}
        <div className="flex-shrink-0 w-48 sm:w-64 pt-0.5">
          <div className="font-medium text-sm text-foreground">{shortKey}</div>
          {path && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate" title={translationKey}>
              {path}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <textarea
                ref={inputRef}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setWarning('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-full px-3 py-2 rounded-lg border border-primary/30 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[112px] font-mono"
                rows={Math.max(4, editValue.split('\n').length || 1)}
              />
              <div className="text-xs text-muted-foreground space-x-3">
                <span className="text-amber-600">{'{ }'} = zmienna dynamiczna</span>
                <span className="text-primary">{'<highlight>'} = pogrubienie</span>
              </div>
              {warning && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{warning}</p>
                    <Button size="sm" variant="outline" className="mt-1 h-6 text-xs" onClick={forceSave}>
                      Zapisz mimo to
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="h-7 text-xs gap-1">
                  <Check className="w-3 h-3" /> Zapisz
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs gap-1">
                  <X className="w-3 h-3" /> Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-accent/50 transition-colors"
              onClick={startEdit}
            >
              <TranslationPreview text={value} />
            </div>
          )}
        </div>

        {/* Edit button */}
        {!editing && (
          <Button
            size="icon"
            variant="ghost"
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}