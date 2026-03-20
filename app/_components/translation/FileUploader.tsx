import React, { useCallback, useState } from 'react';
import { Upload, FileJson, Loader2 } from 'lucide-react';
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { flattenJSON } from '@/lib/translationUtils';

type FileUploaderProps = {
  onFileLoaded: (data: {
    name: string;
    translations: Record<string, string>;
    keysCount: number;
  }) => void;
};

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Proszę wybrać plik JSON.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const flat = flattenJSON(json);
      const keysCount = Object.keys(flat).length;
      
      if (keysCount === 0) {
        setError('Plik JSON jest pusty lub nie zawiera tłumaczeń.');
        setLoading(false);
        return;
      }
      
      onFileLoaded({
        name: file.name,
        translations: flat,
        keysCount
      });
    } catch {
      setError('Nieprawidłowy format pliku JSON.');
    }
    setLoading(false);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="max-w-lg mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${dragging 
            ? 'border-primary bg-accent scale-[1.02]' 
            : 'border-border hover:border-primary/40 hover:bg-accent/30'
          }
        `}
        onClick={() => document.getElementById('json-file-input')?.click()}
      >
        {loading ? (
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
              <FileJson className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              Przeciągnij plik JSON tutaj
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              lub kliknij aby wybrać plik
            </p>
            <Button variant="outline" size="sm" className="pointer-events-none">
              <Upload className="w-4 h-4 mr-2" /> Wybierz plik
            </Button>
          </>
        )}
        <Input
          id="json-file-input"
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
      
      {error && (
        <p className="text-sm text-destructive mt-3 text-center">{error}</p>
      )}
    </div>
  );
}