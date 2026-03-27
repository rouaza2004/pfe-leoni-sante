import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/api/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await api.get("/notifications/");
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setErr("Erreur chargement notifications.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Centre de notifications</h1>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : err ? (
        <p className="text-red-600">{err}</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Aucune notification pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{n.title}</div>
              <div className="text-sm text-slate-600">{n.message}</div>
              <div className="mt-1 text-xs text-slate-400">{n.created_at}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
