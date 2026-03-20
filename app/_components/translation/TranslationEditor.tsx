import React, { useState, useMemo } from 'react';
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Search, Download, Save, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import TranslationRow from './TranslationRow';

type TreeNode = {
  name: string;
  path: string;
  leafKey: string | null;
  children: Record<string, TreeNode>;
  subtreeKeys: string[];
};

function createNode(name: string, path: string): TreeNode {
  return {
    name,
    path,
    leafKey: null,
    children: {},
    subtreeKeys: [],
  };
}

function finalizeSubtreeKeys(node: TreeNode): string[] {
  const result: string[] = [];

  if (node.leafKey) {
    result.push(node.leafKey);
  }

  const childNames = Object.keys(node.children);
  for (const childName of childNames) {
    result.push(...finalizeSubtreeKeys(node.children[childName]));
  }

  node.subtreeKeys = result;
  return result;
}

function buildTree(keys: string[]): TreeNode {
  const root = createNode('__root__', '');

  for (const key of keys) {
    const parts = key.split('.');
    let cursor = root;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const path = cursor.path ? `${cursor.path}.${part}` : part;

      if (!cursor.children[part]) {
        cursor.children[part] = createNode(part, path);
      }

      cursor = cursor.children[part];
      if (i === parts.length - 1) {
        cursor.leafKey = key;
      }
    }
  }

  finalizeSubtreeKeys(root);
  return root;
}

function getDepthSectionClass(depth: number): string {
  if (depth <= 0) return 'bg-muted/50 hover:bg-muted';
  if (depth === 1) return 'bg-accent/40 hover:bg-accent/60';
  if (depth === 2) return 'bg-secondary/50 hover:bg-secondary/70';
  return 'bg-background/80 hover:bg-accent/40';
}

type TranslationEditorProps = {
  translations: Record<string, string>;
  onChange: (key: string, newValue: string) => void;
  onSave: () => void;
  onExport: () => void;
  onSendToUat: () => void;
  saving: boolean;
  sendingToUat: boolean;
  dirtyKeys: Set<string>;
};

export default function TranslationEditor({
  translations,
  onChange,
  onSave,
  onExport,
  onSendToUat,
  saving,
  sendingToUat,
  dirtyKeys,
}: TranslationEditorProps) {
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const allKeys = useMemo(() => Object.keys(translations), [translations]);
  const tree = useMemo(() => buildTree(allKeys), [allKeys]);

  const visibleKeys = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return new Set(allKeys);
    }

    return new Set(
      allKeys.filter(
        (key) => key.toLowerCase().includes(query) || translations[key].toLowerCase().includes(query)
      )
    );
  }, [allKeys, search, translations]);

  const totalKeys = Object.keys(translations).length;
  const filteredCount = visibleKeys.size;

  const toggleGroup = (path: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [path]: !(prev[path] ?? true) }));
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange(key, newValue);
  };

  const allGroupPaths = useMemo(() => {
    const paths: string[] = [];

    const walk = (node: TreeNode) => {
      const hasChildren = Object.keys(node.children).length > 0;
      if (node.path && hasChildren) {
        paths.push(node.path);
      }
      for (const child of Object.values(node.children)) {
        walk(child);
      }
    };

    walk(tree);
    return paths;
  }, [tree]);

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const path of allGroupPaths) {
      next[path] = true;
    }
    setCollapsedGroups(next);
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const path of allGroupPaths) {
      next[path] = false;
    }
    setCollapsedGroups(next);
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const hasVisibleContent = node.subtreeKeys.some((key) => visibleKeys.has(key));
    if (!hasVisibleContent) {
      return null;
    }

    const hasChildren = Object.keys(node.children).length > 0;
    const isRoot = node.path === '';
    const isCollapsed = collapsedGroups[node.path] ?? true;

    const editedCount = node.subtreeKeys.filter((key) => dirtyKeys.has(key)).length;
    const visibleCount = node.subtreeKeys.filter((key) => visibleKeys.has(key)).length;
    const sectionClass = editedCount > 0 ? 'bg-amber-100/70 hover:bg-amber-100 text-amber-900' : getDepthSectionClass(depth);

    return (
      <div
        key={node.path || '__root__'}
        className={!isRoot && depth > 0 ? 'relative ml-4 border-l border-border/70' : ''}
      >
        {!isRoot && hasChildren && (
          <button
            onClick={() => toggleGroup(node.path)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 sm:px-6 transition-colors text-left border-b border-border ${sectionClass}`}
            style={depth > 0 ? { paddingLeft: `${10 + depth * 14}px` } : undefined}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-semibold text-sm text-foreground capitalize">{node.name.replace(/_/g, ' ')}</span>
            <Badge variant="outline" className="ml-auto text-xs">{visibleCount}</Badge>
            {editedCount > 0 && (
              <Badge className="text-xs bg-amber-600 text-white hover:bg-amber-600">Edytowano: {editedCount}</Badge>
            )}
          </button>
        )}

        {(isRoot || !hasChildren || !isCollapsed) && (
          <>
            {node.leafKey && visibleKeys.has(node.leafKey) && (
              <div style={depth > 0 ? { paddingLeft: `${8 + depth * 14}px` } : undefined}>
                <TranslationRow
                  key={node.leafKey}
                  translationKey={node.leafKey}
                  value={translations[node.leafKey]}
                  onSave={handleValueChange}
                />
              </div>
            )}

            {Object.values(node.children).map((child) =>
              renderNode(child, isRoot ? depth : depth + 1)
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po kluczu lub treści..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={expandAll}>
            Rozwiń wszystko
          </Button>
          <Button variant="outline" onClick={collapseAll}>
            Zwiń wszystko
          </Button>
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Zapisz
          </Button>
          <Button variant="outline" onClick={onSendToUat} disabled={sendingToUat} className="gap-2">
            {sendingToUat ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Wyślij do UAT
          </Button>
          <Button variant="outline" onClick={onExport} className="gap-2">
            <Download className="w-4 h-4" /> Eksportuj JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary">{totalKeys} kluczy</Badge>
        {search && <span>Znaleziono: {filteredCount}</span>}
      </div>

      {/* Translation groups */}
      <div className="bg-card border border-border overflow-hidden shadow-sm">
        {renderNode(tree, 0)}
        
        {filteredCount === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <p className="text-lg">Brak wyników</p>
            <p className="text-sm mt-1">Spróbuj zmienić zapytanie wyszukiwania</p>
          </div>
        )}
      </div>
    </div>
  );
}