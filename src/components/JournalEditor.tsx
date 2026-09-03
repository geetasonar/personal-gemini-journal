import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { JournalEntry, JournalMessage, ReflectionMode } from '../types';
import { MOOD_OPTIONS, REFLECTION_MODES, REFLECTION_PROMPTS } from '../data/prompts';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Layers,
  Tag,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Menu,
} from 'lucide-react';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updatedEntry: JournalEntry) => Promise<void>;
  onToggleSidebar: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave: () => void;
}

export function JournalEditor({
  entry,
  onUpdateEntry,
  onToggleSidebar,
  saveStatus,
  onRetrySave,
}: JournalEditorProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState(false);
  const [showSummarySection, setShowSummarySection] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTitleChange = async (newTitle: string) => {
    const updated: JournalEntry = {
      ...entry,
      title: newTitle,
    };
    await onUpdateEntry(updated);
  };

  const handleMoodSelect = async (newMood: string) => {
    const updated: JournalEntry = {
      ...entry,
      mood: newMood,
    };
    await onUpdateEntry(updated);
  };

  const handleModeSelect = async (newMode: ReflectionMode) => {
    const updated: JournalEntry = {
      ...entry,
      mode: newMode,
    };
    await onUpdateEntry(updated);
  };

  // Send message to Gemini chat API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    setErrorMessage(null);
    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...entry.messages, userMessage];

    // Optimistically update entry with user message
    const updatedEntryWithUser: JournalEntry = {
      ...entry,
      title: entry.title === 'New Reflection' && entry.messages.length === 0 ? textToSend.slice(0, 45) : entry.title,
      messages: newMessages,
    };

    try {
      await onUpdateEntry(updatedEntryWithUser);
      setInputPrompt('');
      setIsGenerating(true);

      // Call backend /api/chat endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: entry.mode,
          reflectionTitle: updatedEntryWithUser.title,
          currentMood: entry.mood,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalUpdatedEntry: JournalEntry = {
        ...updatedEntryWithUser,
        messages: [...newMessages, assistantMessage],
      };

      await onUpdateEntry(finalUpdatedEntry);
    } catch (err: any) {
      console.error('Error generating reply from Gemini:', err);
      setErrorMessage(err.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
      textareaRef.current?.focus();
    }
  };

  // Summarize the current conversation session
  const handleGenerateSummary = async () => {
    if (entry.messages.length === 0 || isSummarizing) return;

    try {
      setIsSummarizing(true);
      setErrorMessage(null);

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: entry.messages.map((m) => ({ role: m.role, content: m.content })),
          title: entry.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize summary.');
      }

      const data = await response.json();
      const updated: JournalEntry = {
        ...entry,
        summary: data.summary,
        mood: data.mood || entry.mood,
        takeaways: data.takeaways || [],
        actionItems: data.actionItems || [],
        tags: data.tags || entry.tags || [],
      };

      await onUpdateEntry(updated);
      setShowSummarySection(true);
    } catch (err: any) {
      console.error('Error in summarization:', err);
      setErrorMessage(err.message || 'Failed to synthesize journal summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportMarkdown = () => {
    const lines: string[] = [
      `# ${entry.title || 'Journal Reflection'}`,
      `**Date:** ${new Date(entry.createdAt).toLocaleDateString()} ${new Date(entry.createdAt).toLocaleTimeString()}`,
      `**Mood:** ${entry.mood}`,
      `**Mode:** ${entry.mode}`,
      '',
    ];

    if (entry.summary) {
      lines.push('## Reflection Summary');
      lines.push(entry.summary);
      lines.push('');
    }

    if (entry.takeaways && entry.takeaways.length > 0) {
      lines.push('### Key Takeaways');
      entry.takeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push('');
    }

    if (entry.actionItems && entry.actionItems.length > 0) {
      lines.push('### Action Items');
      entry.actionItems.forEach((a) => lines.push(`- [ ] ${a}`));
      lines.push('');
    }

    lines.push('---');
    lines.push('## Conversation Transcript');
    lines.push('');

    entry.messages.forEach((m) => {
      const speaker = m.role === 'assistant' ? 'Gemini 3.6 Flash' : 'User';
      lines.push(`### ${speaker} (${new Date(m.timestamp).toLocaleTimeString()}):`);
      lines.push(m.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Bar: Title, Status, Action Buttons */}
      <div
        className="border-b px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg lg:hidden opacity-80 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-primary)' }}
            title="Open Reflections History"
          >
            <Menu className="w-5 h-5" />
          </button>

          <input
            id="journal-title-input"
            type="text"
            value={entry.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Reflection Title..."
            className="font-bold text-lg sm:text-xl font-serif bg-transparent border-b border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-black/40 dark:focus:border-white/40 focus:outline-none px-1 py-0.5 w-full transition"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Save Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {saveStatus === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-current" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Vault Synced</span>
              </>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={onRetrySave}
                className="flex items-center gap-1 text-red-600 hover:underline"
              >
                <AlertCircle className="w-3 h-3" />
                <span>Save Error (Retry)</span>
              </button>
            )}
            {saveStatus === 'idle' && (
              <span className="opacity-70">Cloud Synced</span>
            )}
          </div>

          {/* Export Markdown */}
          <button
            id="journal-export-btn"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border transition shadow-2xs hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            title="Export as Markdown document"
          >
            <Download className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          {/* AI Summarize Action */}
          <button
            id="journal-summarize-btn"
            onClick={handleGenerateSummary}
            disabled={entry.messages.length === 0 || isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium border transition shadow-2xs disabled:opacity-40 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-text)',
            }}
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-current" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-current" />
            )}
            <span>{entry.summary ? 'Re-Synthesize' : 'Synthesize AI Insights'}</span>
          </button>
        </div>
      </div>

      {/* Mode & Mood Customizer Header */}
      <div
        className="px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Mood Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-[11px] mr-1 opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Mood:
          </span>
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMoodSelect(m.id)}
              className="px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition border"
              style={{
                backgroundColor: entry.mood === m.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                borderColor: entry.mood === m.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: entry.mood === m.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* AI Reflection Persona / Mode Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-[11px] mr-1 opacity-75" style={{ color: 'var(--text-secondary)' }}>
            Partner Mode:
          </span>
          {REFLECTION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              title={mode.desc}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium transition border"
              style={{
                backgroundColor: entry.mode === mode.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: entry.mode === mode.id ? '#FFFFFF' : 'var(--text-secondary)',
                borderColor: entry.mode === mode.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation & Content Area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 transition-colors"
        style={{
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        {/* Summary Card (If Present) */}
        {entry.summary && (
          <div
            className="p-5 rounded-2xl border space-y-4 shadow-2xs max-w-4xl mx-auto transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <Sparkles className="w-4 h-4 text-current" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base font-serif" style={{ color: 'var(--text-primary)' }}>
                  AI Synthesis & Key Takeaways
                </h3>
              </div>
              <button
                onClick={() => setShowSummarySection(!showSummarySection)}
                className="opacity-70 hover:opacity-100 p-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {showSummarySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showSummarySection && (
              <div className="space-y-3.5 pt-1 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                <p
                  className="p-3.5 rounded-xl border leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {entry.summary}
                </p>

                {entry.takeaways && entry.takeaways.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75" style={{ color: 'var(--accent-text)' }}>
                      Key Revelations
                    </span>
                    <ul className="space-y-1 pl-4 list-disc opacity-90" style={{ color: 'var(--text-primary)' }}>
                      {entry.takeaways.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.actionItems && entry.actionItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75" style={{ color: 'var(--accent-text)' }}>
                      Actionable Micro-Steps
                    </span>
                    <div className="space-y-1">
                      {entry.actionItems.map((a, idx) => (
                        <div key={idx} className="flex items-start gap-2" style={{ color: 'var(--text-primary)' }}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <Tag className="w-3 h-3 opacity-60" style={{ color: 'var(--text-secondary)' }} />
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Stream */}
        {entry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-10 text-center space-y-6">
            <div
              className="w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center shadow-2xs"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-text)',
              }}
            >
              <Sparkles className="w-5 h-5 text-current" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-2xl font-serif" style={{ color: 'var(--text-primary)' }}>
                Begin Your Reflection
              </h3>
              <p className="text-sm max-w-md mx-auto opacity-75" style={{ color: 'var(--text-secondary)' }}>
                Write down what is on your mind, unpack a dilemma, or choose an introspective prompt below.
              </p>
            </div>

            {/* Prompt Starter Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {REFLECTION_PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setInputPrompt(p.prompt);
                    handleModeSelect(p.suggestedMode);
                  }}
                  className="p-3.5 rounded-xl border text-left transition group space-y-1 shadow-2xs hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
                      {p.category}
                    </span>
                    <span className="text-[10px] opacity-60 group-hover:opacity-100" style={{ color: 'var(--text-secondary)' }}>
                      Use Prompt →
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</h4>
                  <p className="text-[11px] line-clamp-2 opacity-75" style={{ color: 'var(--text-secondary)' }}>{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {entry.messages.map((message) => {
              const isUser = message.role === 'user';
              const isSpeaking = speakingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                      color: isUser ? '#FFFFFF' : 'var(--accent-text)',
                      borderColor: 'var(--border-subtle)',
                      borderWidth: isUser ? 0 : 1,
                    }}
                  >
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-1 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1 text-[10px] opacity-75" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {isUser ? 'You' : 'ReflectAI (Gemini 3.8 Flash)'}
                      </span>
                      <span>•</span>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {message.modelUsed && (
                        <span
                          className="font-mono px-1.5 py-0.5 rounded-full text-[9px] border shadow-2xs"
                          style={{
                            backgroundColor: 'var(--bg-surface-subtle)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {message.modelUsed}
                        </span>
                      )}
                    </div>

                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-shadow duration-200 ${
                        isUser
                          ? 'rounded-tr-none text-white'
                          : 'border rounded-tl-none markdown-container font-editorial'
                      }`}
                      style={{
                        backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        borderColor: isUser ? 'transparent' : 'var(--border-subtle)',
                        color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                      }}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-sans leading-relaxed">{message.content}</p>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {/* Action Bar for Message */}
                    <div className="flex items-center gap-2 px-1 pt-0.5">
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="text-[10px] opacity-70 hover:opacity-100 flex items-center gap-1 transition"
                        style={{ color: 'var(--text-secondary)' }}
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {!isUser && 'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeak(message.content, message.id)}
                          className="text-[10px] flex items-center gap-1 transition opacity-70 hover:opacity-100"
                          style={{
                            color: isSpeaking ? 'var(--accent-text)' : 'var(--text-secondary)',
                            fontWeight: isSpeaking ? 600 : 400,
                          }}
                          title="Listen to reflection"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isSpeaking ? 'Stop Reading' : 'Listen'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Generating Indicator */}
            {isGenerating && (
              <div className="flex items-start gap-3.5 max-w-4xl mx-auto">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 animate-pulse"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#FFFFFF',
                  }}
                >
                  <Bot className="w-4 h-4" />
                </div>
                <div
                  className="p-4 rounded-2xl border text-xs flex items-center gap-2 rounded-tl-none shadow-2xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  <span>Gemini is reflecting deeply on your thoughts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Composer Area */}
      <div
        className="border-t p-3 sm:p-4 space-y-2 shrink-0 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {errorMessage && (
          <div className="max-w-4xl mx-auto p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 font-semibold rounded text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Prompt Inspiration Drawer Toggle */}
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
          <button
            onClick={() => setShowPromptsDrawer(!showPromptsDrawer)}
            className="flex items-center gap-1.5 text-[11px] font-medium transition opacity-80 hover:opacity-100"
            style={{ color: 'var(--text-primary)' }}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{showPromptsDrawer ? 'Hide Inspiration Prompts' : 'Need inspiration? Browse Prompts'}</span>
          </button>

          <span className="text-[11px] opacity-60 hidden sm:inline">
            Press <kbd className="font-mono px-1 rounded text-[10px] border bg-black/5 dark:bg-white/10" style={{ borderColor: 'var(--border-subtle)' }}>⌘</kbd> + <kbd className="font-mono px-1 rounded text-[10px] border bg-black/5 dark:bg-white/10" style={{ borderColor: 'var(--border-subtle)' }}>Enter</kbd> to reflect
          </span>
        </div>

        {/* Inspiration Prompts Carousel Drawer */}
        {showPromptsDrawer && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
            {REFLECTION_PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setInputPrompt(p.prompt);
                  handleModeSelect(p.suggestedMode);
                  setShowPromptsDrawer(false);
                }}
                className="p-2.5 rounded-xl border text-left transition hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <p className="text-[10px] font-semibold" style={{ color: 'var(--accent-text)' }}>{p.title}</p>
                <p className="text-[11px] line-clamp-1 opacity-75" style={{ color: 'var(--text-secondary)' }}>{p.prompt}</p>
              </button>
            ))}
          </div>
        )}

        {/* Text Input Box */}
        <div
          className="max-w-4xl mx-auto flex items-end gap-2 rounded-2xl border p-2 transition focus-within:ring-2 focus-within:ring-amber-500/20"
          style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <textarea
            id="journal-composer-textarea"
            ref={textareaRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Share your thoughts, experiences, or dilemmas with your ${
              REFLECTION_MODES.find((m) => m.id === entry.mode)?.name || 'Thought Partner'
            }...`}
            className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm placeholder:opacity-50 focus:outline-none px-2 py-1 max-h-32"
            style={{
              color: 'var(--text-primary)',
            }}
          />

          <button
            id="journal-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isGenerating}
            className="p-2.5 rounded-xl text-white transition disabled:opacity-30 shadow-2xs shrink-0 hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
            title="Send Reflection to Gemini"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
