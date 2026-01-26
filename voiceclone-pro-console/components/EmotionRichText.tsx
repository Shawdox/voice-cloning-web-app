  
import React, { useRef, useEffect } from 'react';

interface EmotionRichTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const EMOTION_TAG_REGEX = /\(([^()]+)\)/g;

const EmotionRichText: React.FC<EmotionRichTextProps> = ({
  value,
  onChange,
  placeholder,
  className,
  maxLength = 2000,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const parseTextToHTML = (text: string): string => {
    return text.replace(EMOTION_TAG_REGEX, (match) => {
      return `<span class="emotion-tag">${match}</span>`;
    });
  };

  const extractTextFromHTML = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  };

  const syncContent = () => {
    if (!editorRef.current) return;
    
    isInternalChange.current = true;
    editorRef.current.innerHTML = parseTextToHTML(value);
    isInternalChange.current = false;
  };

  useEffect(() => {
    syncContent();
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isInternalChange.current) return;

    const editor = e.currentTarget;
    const newText = extractTextFromHTML(editor.innerHTML);
    const truncatedText = newText.slice(0, maxLength);
    
    if (newText !== truncatedText) {
      onChange(truncatedText);
    } else {
      onChange(newText);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  };

  return (
    <div
      ref={editorRef as any}
      contentEditable="true"
      className={className}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      suppressContentEditableWarning
    />
  );
};

export default EmotionRichText;
