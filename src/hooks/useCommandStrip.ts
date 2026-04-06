import { useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';

interface UseCommandStripProps {
  projectName?: string;
  projectStage?: string;
}

export const COMMAND_PROCESSING_DELAY = 1500;
export const MAX_QUERY_LENGTH = 200;

export type TriggerType = 'whatsapp' | 'telegram' | 'email';

export const useCommandStrip = ({ projectName = '', projectStage = '' }: UseCommandStripProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);

  const { messages, input, setInput, append, isLoading, setMessages } = useChat({
    api: '/api/mobile/query',
    initialMessages: [],
  });

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
