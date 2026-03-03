// src/components/ui/tabs.jsx
import React, { createContext, useContext, useMemo, useState } from "react";

const TabsCtx = createContext(null);

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  const ctx = useMemo(() => ({ value, setValue }), [value]);
  return <TabsCtx.Provider value={ctx}>{children}</TabsCtx.Provider>;
}

export function TabsList({ children, className = "" }) {
  return <div className={className} style={{ display: "flex", gap: 8 }}>{children}</div>;
}

export function TabsTrigger({ value, children, className = "" }) {
  const ctx = useContext(TabsCtx);
  const active = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={className}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: active ? "#eee" : "transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const ctx = useContext(TabsCtx);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}