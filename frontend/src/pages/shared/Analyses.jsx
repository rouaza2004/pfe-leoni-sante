import { useState } from 'react';
import { analyses } from '@/data/mock';
import StatusBadge from '@/components/StatusBadge';
import { Search } from 'lucide-react';

export default function Analyses() {
  const [search, setSearch] = useState('');

  const filtered = analyses
    .filter(a => `${a.collaborateurNom} ${a.type}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Analyses Médicales</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-10 rounded-lg border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Collaborateur</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Type</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Demandée le</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Date analyse</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Résultat</th>
          </tr></thead>
          <tbody>{filtered.map(a => (
            <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm font-medium">{a.collaborateurNom}</td>
              <td className="px-4 py-3 text-sm">{a.type}</td>
              <td className="px-4 py-3 text-sm hidden md:table-cell">{a.dateDemande}</td>
              <td className="px-4 py-3 text-sm hidden lg:table-cell">{a.dateAnalyse || '-'}</td>
              <td className="px-4 py-3"><StatusBadge status={a.statut} /></td>
              <td className="px-4 py-3 text-sm hidden lg:table-cell">{a.resultats || '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}