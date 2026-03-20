"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileJson, FolderOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import FileUploader from "@/app/_components/translation/FileUploader";
import TranslationEditor from "@/app/_components/translation/TranslationEditor";
import { unflattenJSON } from "@/lib/translationUtils";

type TranslationFile = {
  id: number;
  name: string;
  translations: Record<string, string>;
  keys_count: number;
  created_date: string;
  updated_date: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Home() {
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [localTranslations, setLocalTranslations] = useState<Record<string, string> | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? null,
    [files, activeFileId]
  );

  const dirtyKeys = useMemo(() => {
    if (!activeFile || !localTranslations) {
      return new Set<string>();
    }

    const keys = new Set<string>([
      ...Object.keys(activeFile.translations),
      ...Object.keys(localTranslations),
    ]);

    const changed = new Set<string>();
    for (const key of keys) {
      if (activeFile.translations[key] !== localTranslations[key]) {
        changed.add(key);
      }
    }

    return changed;
  }, [activeFile, localTranslations]);

  async function loadFiles() {
    setLoadingFiles(true);
    try {
      const response = await fetch("/api/translation-files", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Cannot load files");
      }
      const data = (await response.json()) as TranslationFile[];
      setFiles(data);
    } catch {
      alert("Nie udało się pobrać listy plików.");
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    void loadFiles();
  }, []);

  useEffect(() => {
    if (activeFile) {
      setLocalTranslations({ ...activeFile.translations });
    } else {
      setLocalTranslations(null);
    }
  }, [activeFile]);

  async function handleFileLoaded(data: {
    name: string;
    translations: Record<string, string>;
    keysCount: number;
  }) {
    const response = await fetch("/api/translation-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        translations: data.translations,
        keys_count: data.keysCount,
      }),
    });

    if (!response.ok) {
      alert("Nie udało się zapisać pliku.");
      return;
    }

    const created = (await response.json()) as TranslationFile;
    setFiles((prev) => [created, ...prev]);
    setActiveFileId(created.id);
    setShowUploader(false);
  }

  function handleTranslationChange(key: string, newValue: string) {
    setLocalTranslations((prev) => (prev ? { ...prev, [key]: newValue } : prev));
  }

  async function handleSave() {
    if (!activeFileId || !localTranslations) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/translation-files/${activeFileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: localTranslations,
          keys_count: Object.keys(localTranslations).length,
        }),
      });

      if (!response.ok) {
        throw new Error("Cannot save file");
      }

      const updated = (await response.json()) as TranslationFile;
      setFiles((prev) => prev.map((file) => (file.id === updated.id ? updated : file)));
    } catch {
      alert("Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(file: TranslationFile) {
    const confirmed = window.confirm(`Usunąć plik \"${file.name}\"?`);
    if (!confirmed) return;

    const response = await fetch(`/api/translation-files/${file.id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Nie udało się usunąć pliku.");
      return;
    }

    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (activeFileId === file.id) {
      setActiveFileId(null);
      setLocalTranslations(null);
    }
  }

  function handleExport() {
    if (!localTranslations) return;

    const nested = unflattenJSON(localTranslations);
    const blob = new Blob([JSON.stringify(nested, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile?.name || "translations.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!activeFileId && !showUploader) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent flex items-center justify-center">
              <FileJson className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Edytor Tłumaczeń</h1>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Wgraj plik JSON z tłumaczeniami, edytuj i zapisuj dane w lokalnej bazie SQLite.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Button onClick={() => setShowUploader(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" /> Wgraj nowy plik
            </Button>
          </div>

          {loadingFiles ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                Zapisane pliki
              </h2>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setActiveFileId(file.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.keys_count || "?"} kluczy
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Edytowano: {formatDate(file.updated_date)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(file);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nie masz jeszcze żadnych plików z tłumaczeniami.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showUploader) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Wgraj plik z tłumaczeniami</h1>
            <p className="text-muted-foreground mt-1">Obsługujemy zagnieżdżone pliki JSON</p>
          </div>
          <FileUploader onFileLoaded={handleFileLoaded} />
          <div className="text-center mt-6">
            <Button variant="ghost" onClick={() => setShowUploader(false)}>
              Wróć do listy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setActiveFileId(null)}>
            Wróć
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <FileJson className="w-5 h-5 text-primary flex-shrink-0" />
            <h1 className="font-semibold text-foreground truncate">{activeFile?.name}</h1>
          </div>
        </div>

        {localTranslations ? (
          <TranslationEditor
            key={activeFileId}
            translations={localTranslations}
            onChange={handleTranslationChange}
            onSave={handleSave}
            onExport={handleExport}
            saving={saving}
            dirtyKeys={dirtyKeys}
          />
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
