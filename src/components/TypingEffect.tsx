import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

export const TypingEffect = ({ 
  text, 
  speed = 30,
  wordDelay = 100,
  punctuationDelay = 300,
  onComplete
}: {
  text: string;
  speed?: number;
  wordDelay?: number;
  punctuationDelay?: number;
  onComplete?: () => void;
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const words = text.split(/(\s+)/).filter(chunk => chunk.trim().length > 0);

  useEffect(() => {
    const getThemeFromLocalStorage = () => {
      try {
        const theme = localStorage.getItem('ui-theme');
        if (theme === 'dark' || theme === 'light' || theme === 'system') {
          const isDark = theme === 'dark' || 
                        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
          setIsDarkMode(isDark);
        }
      } catch (e) {
        console.error('Error reading theme from localStorage:', e);
      }
    };

    getThemeFromLocalStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ui-theme') {
        getThemeFromLocalStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isDarkMode]);

  useEffect(() => {
    if (!text || currentIndex >= words.length) {
      if (currentIndex >= words.length && isTyping) {
        setIsTyping(false);
        onComplete?.();
      }
      return;
    }

    let delay = speed;
    const currentWord = words[currentIndex];
    
    if (/[.,!?;:]$/.test(currentWord)) {
      delay = punctuationDelay;
    } else if (currentWord.length > 8) {
      delay = wordDelay;
    }

    if (Math.random() < 0.1) {
      delay *= 1.5 + Math.random();
    }

    const timer = setTimeout(() => {
      setDisplayedText(prev => {
        if (currentWord.match(/^\s+$/)) {
          return prev + currentWord;
        }
        return prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + currentWord;
      });
      setCurrentIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, currentIndex, speed, wordDelay, punctuationDelay, words, isTyping, onComplete]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [text]);

  return (
    <div 
      className="typing-container" 
      style={{ 
        position: 'relative',
        minHeight: '2em',
        color: isDarkMode ? '#ffffff' : '#000000'
      }}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayedText) }} 
        className="typing-content"
      />
    </div>
  );
};