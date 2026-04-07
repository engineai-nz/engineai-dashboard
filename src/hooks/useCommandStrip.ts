import { useState, useMemo, useCallback } from 'react';
// NOTE (ben/qa-bypass-and-build-fix): This hook was originally written against an
// older Vercel AI SDK API. In `ai`/`@ai-sdk/react` v3+, useChat no longer returns
// `input`, `setInput`, `append`, `isLoading`. The chat surface below is a local-state
// scaffold so the cockpit compiles and renders for QA. The real chat integration
// needs rewriting against the new useChat({ messages, sendMessage, status }) API.
// See: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat

interface UseCommandStripProps {
  projectName?: string;
  projectStage?: string;
}

export const COMMAND_PROCESSING_DELAY = 1500;
export const MAX_QUERY_LENGTH = 200;

export type TriggerType = 'whatsapp' | 'telegram' | 'email';

// Mirrors the subset of the v6 useChat message shape that CommandStrip.tsx
// actually reads (id, role, content, toolInvocations). The scaffold never
// populates toolInvocations — the field is typed loosely (any[]) because:
//   1. The scaffold has no real tool-call source, so the array is always undefined.
//   2. The consumer (CommandStrip.tsx:80) spreads result into typed
//      ProjectStatusCard / FinancialMetricCard components, which the real
//      v6 useChat would supply via its own loose typing. Pinning a strict
//      shape here would introduce noise the real integration will fix anyway.
// When the real useChat({ messages, sendMessage, status }) integration lands,
// this whole interface should be replaced with the SDK's exported Message type.
interface ScaffoldMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolInvocations?: any[];
}

export const useCommandStrip = ({ projectName = '', projectStage = '' }: UseCommandStripProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);

  // Scaffold chat state — see NOTE above.
  const [messages, setMessages] = useState<ScaffoldMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const append = useCallback((msg: { content: string; role: 'user' | 'assistant' }) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, ...msg }]);
  }, []);

  const safeProjectName = useMemo(() => projectName.trim(), [projectName]);
  const safeProjectStage = useMemo(() => projectStage.trim(), [projectStage]);

  const templates = useMemo(() => {
    const context = safeProjectName ? `[${safeProjectName}]` : '[Global]';
    const stageStr = safeProjectStage ? ` - Stage: ${safeProjectStage.toUpperCase()}` : '';
    
    return {
      whatsapp: `Hi, checking in on the ${safeProjectName || 'project'} progress. Current stage: ${safeProjectStage || 'unknown'}. Any updates?`,
      telegram: `AGENT INTERROGATION: ${context}${stageStr} - REQUESTING FULL TELEMETRY SYNC.`,
      email: `Subject: Project Update - ${safeProjectName || 'EngineAI'}\n\nHi Team,\n\nPlease provide a status report for the current phase: ${safeProjectStage || 'Initialisation'}.`
    };
  }, [safeProjectName, safeProjectStage]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    append({ content: input, role: 'user' });
    setInput('');
    setIsRecording(false);
  }, [input, isLoading, append, setInput]);

  const handleTrigger = useCallback((type: TriggerType) => {
    if (isLoading) return;
    
    const text = templates[type];
    
    try {
      if (type === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } else if (type === 'telegram') {
        window.open(`tg://msg?text=${encodeURIComponent(text)}`, '_blank');
      } else if (type === 'email') {
        const [subjectLine, ...bodyParts] = text.split('\n\n');
        const subject = subjectLine.replace('Subject: ', '');
        const body = bodyParts.join('\n\n');
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      }
    } catch (err) {
      console.error(`ERROR: Could not open ${type.toUpperCase()} client.`);
    }
  }, [isLoading, templates]);

  const toggleRecording = useCallback(() => setIsRecording(prev => prev), []); // Mock for now
  const toggleTriggers = useCallback(() => setShowTriggers(prev => !prev), []);
  const clearMessages = useCallback(() => setMessages([]), [setMessages]);

  return {
    query: input,
    setQuery: setInput,
    isRecording,
    isProcessing: isLoading,
    messages,
    showTriggers,
    safeProjectName,
    handleSend,
    handleTrigger,
    toggleRecording,
    toggleTriggers,
    clearMessages
  };
};
