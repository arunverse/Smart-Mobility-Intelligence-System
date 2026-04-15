import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TerminalFeedProps {
  messages: string[];
  isThinking: boolean;
}

export function TerminalFeed({ messages, isThinking }: TerminalFeedProps) {
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      setDisplayedMessages(prev => {
        if (prev.length < messages.length) {
          return [...prev, messages[currentIndex]];
        }
        return prev;
      });
      currentIndex++;
      if (currentIndex >= messages.length) clearInterval(interval);
    }, 800); // Type out each message with a delay

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="mt-4 flex flex-col gap-1 rounded border border-[var(--color-border-subtle)] bg-[rgba(0,0,0,0.5)] p-3 font-mono text-[10px]">
      {displayedMessages.map((msg, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[var(--color-emerald)]"
        >
          {msg}
        </motion.div>
      ))}
      {isThinking && (
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[var(--color-amber)]"
        >
          [SYS]: Processing...
        </motion.div>
      )}
    </div>
  );
}
