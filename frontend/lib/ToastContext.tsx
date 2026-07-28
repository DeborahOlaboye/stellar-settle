"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Toast } from "@/components/ui/Toast";

type ToastState = {
  showToast: (message: string, href?: string) => void;
};

const ToastContext = createContext<ToastState | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, link?: string) {
    setMessage(msg);
    setHref(link ?? null);
    if (timer.current) clearTimeout(timer.current);
    // Give a link longer on screen than a plain message — it's meant to be clicked.
    timer.current = setTimeout(() => setMessage(null), link ? 6000 : 2600);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast message={message} href={href} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
