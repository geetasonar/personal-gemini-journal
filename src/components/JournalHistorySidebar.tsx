import { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { MOOD_OPTIONS } from '../data/prompts';
import { Search, Plus, Trash2, Calendar, MessageSquare, Sparkles, Filter, ChevronRight, X } from 'lucide-react';

interface JournalHistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function JournalHistorySidebar({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose,
}: JournalHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesMood = !selectedMoodFilter || entry.mood === selectedMoodFilter;

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMoodFilter]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (confirmDeleteId !== entryId) {
      setConfirmDeleteId(entryId);
      return;
    }

    try {
      setDeletingId(entryId);
      await onDeleteEntry(entryId);
    } catch (err) {
      console.error('Error deleting entry:', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-80 sm:w-88 border-r flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Top Header */}
        <div
          className="p-4 border-b space-y-3 transition-colors"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm font-serif" style={{ color: 'var(--text-primary)' }}>
                Reflections Vault
              </h2>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'var(--badge-bg)',
                  borderColor: 'var(--badge-border)',
                  color: 'var(--badge-text)',
                }}
              >
                {entries.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-new-btn"
                onClick={onNewEntry}
                className="p-1.5 rounded-lg text-white transition shadow-2xs hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
                title="Create New Reflection"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 lg:hidden rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--text-secondary)' }} />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search reflections, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none transition focus:ring-1"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mood Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <button
              onClick={() => setSelectedMoodFilter(null)}
              className="px-2.5 py-1 rounded-md shrink-0 font-medium transition border"
              style={{
                backgroundColor: selectedMoodFilter === null ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                color: selectedMoodFilter === null ? '#FFFFFF' : 'var(--text-secondary)',
                borderColor: selectedMoodFilter === null ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              All
            </button>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === m.id ? null : m.id)}
                className="px-2 py-1 rounded-md shrink-0 flex items-center gap-1 font-medium transition border"
                style={{
                  backgroundColor: selectedMoodFilter === m.id ? 'var(--accent-subtle)' : 'var(--bg-surface-subtle)',
                  borderColor: selectedMoodFilter === m.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: selectedMoodFilter === m.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                  fontWeight: selectedMoodFilter === m.id ? 600 : 400,
                }}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div
                className="w-10 h-10 mx-auto rounded-full flex items-center justify-center border opacity-60"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium opacity-70" style={{ color: 'var(--text-secondary)' }}>
                {entries.length === 0 ? 'No reflections yet.' : 'No matching entries found.'}
              </p>
              {entries.length === 0 && (
                <button
                  onClick={onNewEntry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition shadow-2xs hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start First Reflection</span>
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = entry.id === selectedEntryId;
              const moodObj = MOOD_OPTIONS.find((m) => m.id === entry.mood);

              return (
                <div
                  key={entry.id}
                  id={`entry-card-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-xl text-left cursor-pointer transition-all duration-200 border shadow-2xs ${
                    isSelected ? 'shadow-sm -translate-y-0.5' : 'hover:-translate-y-0.5 hover:shadow-xs'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className={`text-xs line-clamp-1 font-serif transition ${isSelected ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--text-primary)' }}>
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {moodObj && (
                        <span className="text-xs" title={`Mood: ${moodObj.label}`}>
                          {moodObj.emoji}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        disabled={deletingId === entry.id}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          confirmDeleteId === entry.id
                            ? 'bg-red-500/20 text-red-500 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500'
                        }`}
                        title={confirmDeleteId === entry.id ? 'Click again to confirm deletion' : 'Delete reflection'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {confirmDeleteId === entry.id && (
                    <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-500 font-medium">
                      Click trash icon again to delete permanently
                    </div>
                  )}

                  {/* Snippet / Summary Preview */}
                  <p className="text-[11px] line-clamp-2 leading-relaxed mb-2 opacity-75" style={{ color: 'var(--text-secondary)' }}>
                    {entry.summary ||
                      entry.messages[entry.messages.length - 1]?.content ||
                      'New reflection session...'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t opacity-65" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.updatedAt || entry.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {entry.messages.length} msg{entry.messages.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
