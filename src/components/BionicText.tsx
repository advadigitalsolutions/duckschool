import { useBionicReading } from '@/contexts/BionicReadingContext';

interface BionicTextProps {
  children: string;
  className?: string;
}

export function BionicText({ children, className = '' }: BionicTextProps) {
  const { enabled } = useBionicReading();

  // Convert children to string and handle non-string values
  const textContent = typeof children === 'string' ? children : String(children || '');
  
  if (!enabled || !textContent || textContent === 'undefined' || textContent === 'null') {
    return <span className={className}>{children}</span>;
  }

  const applyBionicReading = (text: string) => {
    // Split by whitespace while preserving it
    const parts = text.split(/(\s+)/);
    
    return parts.map((part, index) => {
      // If it's whitespace, return as is
      if (/^\s+$/.test(part)) {
        return part;
      }

      // For words, bold the first half (minimum 1 character, maximum word length - 1)
      const word = part;
      if (word.length <= 2) {
        return <span key={index}><strong>{word}</strong></span>;
      }

      const boldLength = Math.ceil(word.length / 2);
      const boldPart = word.slice(0, boldLength);
      const normalPart = word.slice(boldLength);

      return (
        <span key={index}>
          <strong>{boldPart}</strong>{normalPart}
        </span>
      );
    });
  };

  return <span className={className}>{applyBionicReading(textContent)}</span>;
}
