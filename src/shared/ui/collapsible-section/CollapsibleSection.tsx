import './collapsible-section.scss';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useVamsStore } from '@/core/store';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  panelId?: string;
}

const CollapsibleSection = ({ title, icon, children, defaultOpen = false, panelId }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionRef = useRef<HTMLDivElement>(null);

  const lessonFocusPanel = useVamsStore(s => s.lessonFocusPanel);
  const isFocused = !!(panelId && lessonFocusPanel === panelId);

  const [prevIsFocused, setPrevIsFocused] = useState(isFocused);

  if (isFocused && !prevIsFocused) {
    setIsOpen(true);
    setPrevIsFocused(true);
  } else if (!isFocused && prevIsFocused) {
    setPrevIsFocused(false);
  }

  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        const el = sectionRef.current;
        if (el) {
          // Target the specific scrollable container
          const scrollParent = el.closest('.sidebar-content') as HTMLElement;
          
          if (scrollParent) {
            // Calculate center offset safely
            const parentRect = scrollParent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const targetTop = scrollParent.scrollTop + (elRect.top - parentRect.top) - (parentRect.height / 2) + (elRect.height / 2);
            
            scrollParent.scrollTo({ top: targetTop, behavior: 'smooth' });
          } else {
            // Fallback
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  return (
    <div ref={sectionRef} className={`collapsible-section ${isFocused ? 'lesson-focused' : ''}`}>
      <button
        className="section-header-collapsible"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span>{title}</span>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;