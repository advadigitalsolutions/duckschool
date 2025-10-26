import React from 'react';
import { BionicText } from './BionicText';
import { TextToSpeech } from './TextToSpeech';
import { cleanMarkdown } from '@/utils/textFormatting';

interface AssignmentContentRendererProps {
  content: string;
  className?: string;
  enableReadAloud?: boolean;
}

export const AssignmentContentRenderer: React.FC<AssignmentContentRendererProps> = ({
  content,
  className = '',
  enableReadAloud = true
}) => {
  // Type guard at component level: ensure content is a string
  const safeContent = typeof content === 'string' ? content : String(content || '');
  
  if (!safeContent || safeContent === 'undefined' || safeContent === 'null') {
    return <div className={`prose prose-sm max-w-none ${className}`}>No content available</div>;
  }
  // Convert markdown to structured HTML
  const renderMarkdown = (text: string) => {
    // Type guard: ensure text is actually a string
    const safeText = typeof text === 'string' ? text : String(text || '');
    if (!safeText || safeText === 'undefined' || safeText === 'null') return '';
    
    // Split into paragraphs
    const paragraphs = safeText.split('\n\n');
    
    return paragraphs.map((para, idx) => {
      // Handle headings
      if (para.startsWith('### ')) {
        const heading = para.replace('### ', '').trim();
        return (
          <h3 key={idx} className="text-lg font-semibold mb-3 mt-6 first:mt-0">
            <BionicText>{heading}</BionicText>
          </h3>
        );
      }
      
      if (para.startsWith('## ')) {
        const heading = para.replace('## ', '').trim();
        return (
          <h2 key={idx} className="text-xl font-bold mb-4 mt-8 first:mt-0">
            <BionicText>{heading}</BionicText>
          </h2>
        );
      }
      
      // Handle bullet lists
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const items = para.split('\n').filter(line => line.trim().startsWith('- '));
        return (
          <ul key={idx} className="list-disc list-inside mb-4 space-y-2">
            {items.map((item, itemIdx) => {
              const text = item.replace(/^- /, '').trim();
              return (
                <li key={itemIdx} className="leading-relaxed">
                  <BionicText>{formatInlineMarkdown(text)}</BionicText>
                </li>
              );
            })}
          </ul>
        );
      }
      
      // Handle numbered lists
      if (para.match(/^\d+\. /)) {
        const items = para.split('\n').filter(line => line.trim().match(/^\d+\. /));
        return (
          <ol key={idx} className="list-decimal list-inside mb-4 space-y-2">
            {items.map((item, itemIdx) => {
              const text = item.replace(/^\d+\. /, '').trim();
              return (
                <li key={itemIdx} className="leading-relaxed">
                  <BionicText>{formatInlineMarkdown(text)}</BionicText>
                </li>
              );
            })}
          </ol>
        );
      }
      
      // Regular paragraph
      if (para.trim()) {
        return (
          <p key={idx} className="mb-4 leading-relaxed">
            <BionicText>{formatInlineMarkdown(para)}</BionicText>
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  };
  
  // Handle inline markdown (bold, italic, code)
  const formatInlineMarkdown = (text: string): string => {
    // Type guard: ensure text is actually a string
    const safeText = typeof text === 'string' ? text : String(text || '');
    if (!safeText) return '';
    
    // Remove markdown formatting for BionicText
    // Bold **text**
    let cleanedText = safeText.replace(/\*\*(.+?)\*\*/g, '$1');
    // Italic *text*
    cleanedText = cleanedText.replace(/\*(.+?)\*/g, '$1');
    // Code `text`
    cleanedText = cleanedText.replace(/`(.+?)`/g, '$1');
    
    return cleanedText;
  };
  
  const renderedContent = (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderMarkdown(safeContent)}
    </div>
  );

  if (enableReadAloud) {
    return (
      <TextToSpeech text={cleanMarkdown(safeContent)}>
        {renderedContent}
      </TextToSpeech>
    );
  }

  return renderedContent;
};
