import { useEffect, useState } from 'react';

export function Loader() {
  const [loadingText] = useState('Loading');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 z-50">
      <div className="flex flex-col items-center justify-center gap-4">
        <img 
          src="/Loading.gif" 
          alt="Loading"
          className="w-36 h-36 object-contain"
        />
        
        <div className="text-foreground text-lg font-medium">
          {loadingText}
          <span className="opacity-100">{dots}</span>
          <span className="opacity-0">...</span>
        </div>
      </div>
    </div>
  );
}