/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeToUserEntries, saveUserEntry, deleteUserEntry } from './lib/firebase';
import { JournalEntry, ReflectionMode } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalHistorySidebar } from './components/JournalHistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { SecurityModal } from './components/SecurityModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setEntries([]);
        setSelectedEntryId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscription for logged in user's isolated documents
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        // If no entry selected yet, default to most recent if available
        setSelectedEntryId((currentId) => {
          if (currentId && fetchedEntries.some((e) => e.id === currentId)) {
            return currentId;
          }
          return fetchedEntries.length > 0 ? fetchedEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Create a new blank reflection entry
  const handleCreateNewEntry = useCallback(async () => {
    if (!currentUser) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: currentUser.uid,
      title: 'New Reflection',
      mood: 'Reflective',
      mode: 'reflective',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      setSaveStatus('saving');
      await saveUserEntry(currentUser.uid, newEntry);
      setSelectedEntryId(newEntry.id);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to create new entry:', err);
      setSaveStatus('error');
    }
  }, [currentUser]);

  // Update existing or active entry in Firestore
  const handleUpdateEntry = useCallback(
    async (updatedEntry: JournalEntry) => {
      if (!currentUser) return;

      // Optimistic local state update
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === updatedEntry.id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = updatedEntry;
          return clone;
        }
        return [updatedEntry, ...prev];
      });

      try {
        setSaveStatus('saving');
        await saveUserEntry(currentUser.uid, updatedEntry);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Error saving entry to Firestore:', err);
        setSaveStatus('error');
      }
    },
    [currentUser]
  );

  // Delete an entry from Firestore
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!currentUser) return;

      try {
        await deleteUserEntry(currentUser.uid, entryId);
        if (selectedEntryId === entryId) {
          const remaining = entries.filter((e) => e.id !== entryId);
          setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err) {
        console.error('Error deleting entry:', err);
      }
    },
    [currentUser, entries, selectedEntryId]
  );

  // Active selected entry object
  const activeEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // Render Loading Screen while Firebase Auth initializes
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center space-y-4"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: 'var(--accent-primary)',
            borderTopColor: 'transparent',
          }}
        />
        <p className="text-xs font-medium font-mono opacity-70" style={{ color: 'var(--text-secondary)' }}>
          Opening Personal Gemini Journal Vault...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onNewEntry={handleCreateNewEntry}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        entriesCount={entries.length}
      />

      {/* Main Content: Landing Page vs Private Dashboard */}
      {!currentUser ? (
        <main className="flex-1">
          <LandingPage onOpenSecurityModal={() => setIsSecurityModalOpen(true)} />
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden">
          {/* History Sidebar */}
          <JournalHistorySidebar
            entries={entries}
            selectedEntryId={selectedEntryId}
            onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
            onNewEntry={handleCreateNewEntry}
            onDeleteEntry={handleDeleteEntry}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Active Journal Editor */}
          {activeEntry ? (
            <JournalEditor
              key={activeEntry.id}
              entry={activeEntry}
              onUpdateEntry={handleUpdateEntry}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              saveStatus={saveStatus}
              onRetrySave={() => handleUpdateEntry(activeEntry)}
            />
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"
              style={{
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-xl">✍️</span>
              </div>
              <div className="space-y-1">
                <h2 className="font-bold text-xl font-serif" style={{ color: 'var(--text-primary)' }}>
                  Your Private Vault is Ready
                </h2>
                <p className="text-xs max-w-sm opacity-75" style={{ color: 'var(--text-secondary)' }}>
                  Start your first journal reflection to engage with Gemini 3.6 Flash.
                </p>
              </div>
              <button
                id="main-start-reflection-btn"
                onClick={handleCreateNewEntry}
                className="px-4 py-2 rounded-lg font-medium text-xs text-white transition shadow-2xs hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                Create New Reflection
              </button>
            </div>
          )}
        </main>
      )}

      {/* Security Architecture & Threat Model Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
