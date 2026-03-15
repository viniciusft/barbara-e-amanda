"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  // First item open by default
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="divide-y divide-neutral-100">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left focus:outline-none group"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-neutral-800 text-sm leading-snug group-hover:text-[#C9A84C] transition-colors">
                {faq.question}
              </span>
              <span className={`shrink-0 transition-colors ${isOpen ? "text-[#C9A84C]" : "text-neutral-400 group-hover:text-[#C9A84C]"}`}>
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {/* Smooth expand/collapse via max-height transition */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: isOpen ? "600px" : "0px" }}
            >
              <p className="text-neutral-600 text-sm leading-relaxed pb-5">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
