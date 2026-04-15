'use client';

import { useRef, useState } from 'react';
import { PiPaperclipLight, PiPaperPlaneRightFill } from 'react-icons/pi';

interface MessageInputProps {
  onSend: (text: string) => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  onAttach,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    if (e.target) e.target.value = '';
  }

  const hasText = text.trim().length > 0;
  const fileInputId = 'chat-file-input';

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2.5">
      <div className="flex items-end gap-2">
        <div
          className="relative flex flex-1 items-end rounded-full bg-gray-50 px-4 py-2"
          style={{ border: '1px solid #e5e7eb' }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            disabled={disabled}
            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
            className="max-h-[120px] w-full resize-none text-[15px] text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
          />
          <label
            htmlFor={fileInputId}
            className="ml-2 flex-shrink-0 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <PiPaperclipLight className="h-5 w-5" />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!hasText || disabled}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
            hasText && !disabled
              ? 'bg-[#E85D5D] text-white shadow-sm hover:bg-[#D14D4D]'
              : 'bg-[#E85D5D]/40 text-white/70'
          }`}
        >
          <PiPaperPlaneRightFill className="h-5 w-5" />
        </button>
      </div>

      <input
        id={fileInputId}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
