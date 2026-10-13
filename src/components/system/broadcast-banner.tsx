"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";

export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function fetchBroadcast() {
      try {
        const res = await fetch("/api/system/broadcast");
        const data = await res.json();
        if (data.success && data.data) {
          setBroadcast(data.data);
          
          // Optionally, don't show if user previously dismissed this specific broadcast.
          // For simplicity, it shows whenever there's an active one until dismissed per session.
          const dismissedId = sessionStorage.getItem("dismissed_broadcast");
          if (dismissedId !== data.data.id) {
             setVisible(true);
          } else {
             setVisible(false);
          }
        }
      } catch {
        // Silently fail
      }
    }
    fetchBroadcast();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (broadcast) {
       sessionStorage.setItem("dismissed_broadcast", broadcast.id);
    }
  };

  if (!broadcast || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-indigo-600 shadow-sm"
        >
          <div className="max-w-7xl mx-auto py-2.5 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="w-0 flex-1 flex items-center min-w-0 gap-3">
                <span className="flex p-1.5 rounded-lg bg-indigo-800 shrink-0">
                  <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <div className="flex flex-col text-white truncate max-w-full">
                  <p className="font-semibold text-sm truncate">{broadcast.title}</p>
                  <p className="text-xs text-indigo-200 truncate">{broadcast.content}</p>
                </div>
              </div>
              <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="-mr-1 flex p-1.5 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2 transition-colors"
                >
                  <span className="sr-only">Tutup</span>
                  <X className="h-4 w-4 text-white" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
