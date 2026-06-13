import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette({ isOpen, onClose, onAction }: { isOpen: boolean, onClose: () => void, onAction: (action: string) => void }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'find_desk', label: 'Find desk by number' },
    { id: 'zone_w', label: 'Find zone Window Row' },
    { id: 'zone_q', label: 'Find zone Quiet Zone' },
    { id: 'zone_s', label: 'Find zone Study Pods' },
    { id: 'zone_c', label: 'Find zone Collaborative' },
    { id: 'floor_1', label: 'Jump to floor 1' },
    { id: 'floor_2', label: 'Jump to floor 2' },
    { id: 'floor_3', label: 'Jump to floor 3' },
    { id: 'view_booking', label: 'View my booking' },
    { id: 'release_seat', label: 'Release my seat' },
    { id: 'analytics', label: 'Go to analytics' }
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onAction(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onAction, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--paper)] border-2 border-[var(--ink)] w-full max-w-[480px] shadow-none flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search or jump to..."
                className="w-full h-[48px] px-4 border-b-2 border-[var(--ink)] bg-[var(--paper)] font-['Syne'] text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--rule)] caret-[var(--accent)]"
              />
              <div className="max-h-[300px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-4 text-center font-['Syne'] text-[13px] text-[var(--rule)]">
                    No results found.
                  </div>
                ) : (
                  filtered.map((action, idx) => (
                    <div
                      key={action.id}
                      onClick={() => {
                        onAction(action.id);
                        onClose();
                      }}
                      className={`px-4 py-3 font-['Syne'] text-[13px] cursor-pointer
                        ${idx === selectedIndex ? 'bg-[var(--ink)] text-[var(--paper)]' : 'bg-transparent text-[var(--ink)] hover:bg-[var(--paper2)]'}
                      `}
                    >
                      {action.label}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
