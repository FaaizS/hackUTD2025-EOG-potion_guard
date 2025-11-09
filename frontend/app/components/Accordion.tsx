"use client";

import { useState } from "react";

interface AccordionItemProps {
  value: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ trigger, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-purple-300/50 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left bg-white/10 hover:bg-white/20 transition-colors flex justify-between items-center rounded-t-lg"
      >
        <span>{trigger}</span>
        <span className="text-gray-300 text-xl">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 bg-black/20 border-t border-purple-300/50">
          {children}
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  items: Array<{
    value: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
  }>;
  defaultOpen?: string;
}

export default function Accordion({ items, defaultOpen }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpen ? new Set([defaultOpen]) : new Set()
  );

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full">
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          trigger={item.trigger}
          isOpen={openItems.has(item.value)}
          onToggle={() => toggleItem(item.value)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

