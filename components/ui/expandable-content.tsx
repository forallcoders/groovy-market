'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableContentProps {
  children: React.ReactNode;
  previewLines?: number;
  showToggle?: boolean;
  className?: string;
  contentClassName?: string;
  buttonClassName?: string;
  expandText?: string;
  collapseText?: string;
}

export const ExpandableContent = ({
  children,
  previewLines = 3,
  showToggle = true,
  className = '',
  contentClassName = '',
  buttonClassName = '',
  expandText = 'Show more',
  collapseText = 'Show less',
}: ExpandableContentProps) => {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const LINE_HEIGHT = 20;
  const MAX_HEIGHT = LINE_HEIGHT * previewLines;

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > MAX_HEIGHT);
    }
  }, [children, MAX_HEIGHT]);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-500 ease-in-out ${contentClassName}`}
        style={{
          maxHeight: expanded ? `${contentRef.current?.scrollHeight}px` : `${MAX_HEIGHT}px`,
        }}
      >
        {children}
      </div>

      {(showToggle && isOverflowing) && (
        <button
          onClick={toggleExpand}
          className={`flex items-center h-[20px] mt-2 p-0 hover:bg-transparent hover:text-gray-500 text-gray-500/70 text-xs font-semibold ring-offset-transparent ${buttonClassName}`}
        >
          {expanded ? collapseText : expandText}{' '}
          {expanded ? <ChevronUp className="!w-6 !h-6" /> : <ChevronDown className="!w-6 !h-6" />}
        </button>
      )}
    </div>
  );
};