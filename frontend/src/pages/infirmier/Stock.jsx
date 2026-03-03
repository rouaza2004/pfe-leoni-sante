import { useState } from "react";
import { stockItems, mouvementsStock } from "@/data/mock";
import StatusBadge from "@/components/StatusBadge";
import { Search, AlertTriangle, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
console.log("mouvementsStock from mock:", mouvementsStock);
export default function Stock() {
  const [search, setSearch] = useState("");

  const critiques = stockItems.filter((s) => s.quantite <= s.seuil);
  const expirants = stockItems.filter((s) => {
    const diff =
      (new Date(s.dateExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  });

  const filtered = stockItems.filter((s) =>
    s.medicamentNom.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (s) => {
    if (s.quantite <= s.seuil) return "critical";
    const days =
      (new Date(s.dateExpiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days <= 90) return "warning";
    return "normal";
  };

  const exportCSV = () => {
    const csv =
      "Médicament,Lot,Quantité,Seuil,Expiration\n" +
      stockItems
        .map(
          (s) =>
            `${s.medicamentNom},${s.lot},${s.quantite},${s.seuil},${s.dateExpiration}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stock.csv";
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion Stock</h1>
        <button
          onClick={exportCSV}
          className="h-9 px-4 rounded-lg border bg-card text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {(critiques.length > 0 || expirants.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {critiques.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  Stock critique ({critiques.length})
                </span>
              </div>
              {critiques.map((s) => (
                <p key={s.id} className="text-xs text-destructive/80">
                  • {s.medicamentNom}: {s.quantite}/{s.seuil} unités
                </p>
              ))}
            </div>
          )}

          {expirants.length > 0 && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Expiration proche ({expirants.length})
                </span>
              </div>
              {expirants.map((s) => (
                <p key={s.id} className="text-xs">
                  • {s.medicamentNom} — exp. {s.dateExpiration}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="stock">Inventaire</TabsTrigger>
          <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un médicament..."
              className="w-full h-10 rounded-lg border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Médicament
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Lot
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Quantité
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Seuil
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Expiration
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    État
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = getStockStatus(s);
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        "border-b last:border-0",
                        status === "critical" && "bg-destructive/5"
                      )}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {s.medicamentNom}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {s.lot}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {s.quantite}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {s.seuil}
                      </td>
                      <td className="px-4 py-3 text-sm">{s.dateExpiration}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            status === "critical"
                              ? "Critique"
                              : status === "warning"
                              ? "Attention"
                              : "OK"
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mouvements" className="mt-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Médicament
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Quantité
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                    Référence
                  </th>
                </tr>
              </thead>
              <tbody>
                {mouvementsStock.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">{m.date}</td>
                    <td className="px-4 py-3 text-sm">{m.medicamentNom}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {m.type === "entree" ? (
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                        )}
                        {m.type === "entree" ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {m.quantite}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                      {m.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}