import { useState } from 'react';
import { rendezVous } from '@/data/mock';
import StatusBadge from '@/components/StatusBadge';
import { Search, Plus } from 'lucide-react';

export default function RDV() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const filtered = rendezVous
    .filter(r => `${r.collaborateurNom} ${r.type} ${r.medecinNom}`.toLowerCase().includes(search.toLowerCase()))
    .filter(r => !filterStatut || r.statut === filterStatut)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nouveau RDV
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-10 rounded-lg border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="h-10 rounded-lg border bg-card px-3 text-sm outline-none">
          <option value="">Tous les statuts</option>
          <option>Programmé</option><option>Confirmé</option><option>Réalisé</option><option>Annulé</option>
        </select>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Heure</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Collaborateur</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Type</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Médecin</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
          </tr></thead>
          <tbody>{filtered.map(r => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm">{r.date}</td>
              <td className="px-4 py-3 text-sm font-mono">{r.heure}</td>
              <td className="px-4 py-3 text-sm font-medium">{r.collaborateurNom}</td>
              <td className="px-4 py-3 text-sm hidden md:table-cell">{r.type}</td>
              <td className="px-4 py-3 text-sm hidden lg:table-cell">{r.medecinNom}</td>
              <td className="px-4 py-3"><StatusBadge status={r.statut} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}