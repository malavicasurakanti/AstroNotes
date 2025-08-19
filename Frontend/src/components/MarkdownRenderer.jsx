import React from "react";

function MarkdownRenderer({ content, noteId, onCheckboxToggle }) {
  const renderTextFormatting = (text) => {
    if (!text || text.trim() === '') return '';
    
    let result = text;
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/__([^_]+)__/g, '<u>$1</u>');
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    if (result.includes('<') && result.includes('>')) {
      return <span dangerouslySetInnerHTML={{ __html: result }} />;
    }
    
    return result;
  };

  const renderContent = (content) => {
    return content.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} style={{ 
            fontSize: '28px',
            fontWeight: '700', 
            margin: '16px 0 12px 0',
            color: '#1d1d1f',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {renderTextFormatting(line.slice(2))}
          </h1>
        );
      }
      
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} style={{ 
            fontSize: '22px',
            fontWeight: '600', 
            margin: '14px 0 10px 0',
            color: '#1d1d1f',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {renderTextFormatting(line.slice(3))}
          </h2>
        );
      }
      
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} style={{ 
            fontSize: '18px',
            fontWeight: '600', 
            margin: '12px 0 8px 0',
            color: '#1d1d1f',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {renderTextFormatting(line.slice(4))}
          </h3>
        );
      }
      
      // Apple Notes style Checkboxes
      if (line.match(/^- \[(x| )\]/)) {
        const isChecked = line.includes('[x]');
        const text = line.replace(/^- \[(x| )\] /, '');
        return (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            margin: '6px 0',
            cursor: 'pointer',
            textAlign: 'left',
            lineHeight: '1.5'
          }}
          onClick={() => onCheckboxToggle && onCheckboxToggle(noteId, index, content)}
          >
            <div style={{ 
              width: '18px',
              height: '18px',
              marginRight: '10px',
              marginTop: '1px',
              borderRadius: '3px',
              border: isChecked ? 'none' : '2px solid #c7c7cc',
              backgroundColor: isChecked ? '#007AFF' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}>
              {isChecked && (
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                  <path 
                    d="M1 4.5L4.5 8L11 1.5" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span style={{ 
              textDecoration: isChecked ? 'line-through' : 'none',
              opacity: isChecked ? 0.6 : 1,
              color: '#1d1d1f',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '16px',
              lineHeight: '1.5',
              flex: 1
            }}>
              {renderTextFormatting(text)}
            </span>
          </div>
        );
      }
      
      // Links
      if (line.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
        const parts = line.split(/(\[[^\]]+\]\([^)]+\))/);
        const linkElements = parts.map((part, partIndex) => {
          const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            const [, text, url] = linkMatch;
            return (
              <a
                key={partIndex}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#007AFF',
                  textDecoration: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {renderTextFormatting(text)}
              </a>
            );
          }
          return renderTextFormatting(part);
        });
        return (
          <div key={index} style={{ 
            margin: '6px 0',
            color: '#1d1d1f',
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {linkElements}
          </div>
        );
      }
      
      // Images
      if (line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
        const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          const [, alt, src] = match;
          return (
            <div key={index} style={{ 
              margin: '16px 0', 
              textAlign: 'center' 
            }}>
              <img
                src={src}
                alt={alt}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
              {alt && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#7f8c8d', 
                  marginTop: '8px', 
                  fontStyle: 'italic' 
                }}>
                  {alt}
                </div>
              )}
            </div>
          );
        }
      }
      
      // Code blocks
      if (line.startsWith('```') && line.endsWith('```')) {
        const code = line.slice(3, -3);
        return (
          <pre key={index} style={{
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '14px',
            margin: '12px 0',
            border: '1px solid #34495e'
          }}>
            <code>{code}</code>
          </pre>
        );
      }
      
      // Inline code
      if (line.includes('`')) {
        const parts = line.split(/(`[^`]+`)/);
        const codeElements = parts.map((part, partIndex) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={partIndex}
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#e74c3c',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '14px',
                  border: '1px solid #dee2e6'
                }}
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return renderTextFormatting(part);
        });
        return (
          <div key={index} style={{ 
            margin: '6px 0', 
            lineHeight: '1.6',
            color: '#1d1d1f',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {codeElements}
          </div>
        );
      }
      
      // Bullet points
      if (line.startsWith('- ') && !line.includes('[')) {
        const text = line.slice(2);
        return (
          <div key={index} style={{ 
            margin: '6px 0',
            paddingLeft: '20px',
            position: 'relative',
            lineHeight: '1.6',
            color: '#1d1d1f',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            <span style={{ 
              position: 'absolute',
              left: '0',
              top: '0',
              color: '#007AFF',
              fontWeight: 'bold',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              •
            </span>
            {renderTextFormatting(text)}
          </div>
        );
      }
      
      // Block quotes
      if (line.startsWith('> ')) {
        return (
          <blockquote key={index} style={{
            borderLeft: '4px solid #007AFF',
            paddingLeft: '16px',
            margin: '12px 0',
            fontStyle: 'italic',
            color: '#5d6d7e',
            backgroundColor: '#f8f9fa',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0'
          }}>
            {renderTextFormatting(line.slice(2))}
          </blockquote>
        );
      }
      
      // Horizontal rules
      if (line.trim() === '---' || line.trim() === '***') {
        return (
          <hr key={index} style={{
            border: 'none',
            borderTop: '2px solid #e5e5e7',
            margin: '24px 0',
            opacity: 0.6
          }} />
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return (
          <div key={index} style={{ 
            margin: '6px 0',
            color: '#1d1d1f',
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            textAlign: 'left'
          }}>
            {renderTextFormatting(line)}
          </div>
        );
      }
      
      // Empty lines (spacing)
      return <div key={index} style={{ height: '8px' }}></div>;
    });
  };

  return (
    <div style={{ 
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      lineHeight: '1.6'
    }}>
      {renderContent(content)}
    </div>
  );
}

export default MarkdownRenderer;