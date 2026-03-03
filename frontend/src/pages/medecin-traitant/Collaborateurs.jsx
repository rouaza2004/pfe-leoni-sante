import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collaborateurs } from '@/data/mock';
import { Search, UserPlus, ChevronRight } from 'lucide-react';

export default function Collaborateurs() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = collaborateurs.filter(c =>
    `${c.nom} ${c.prenom} ${c.matricule} ${c.departement}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collaborateurs</h1>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <UserPlus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, matricule, département..."
          className="w-full h-10 rounded-lg border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Nom</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Matricule</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Département</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Poste</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Téléphone</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr
                key={c.id}
                onClick={() => navigate(`/collaborateurs/${c.id}`)}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {c.prenom[0]}{c.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono">{c.matricule}</td>
                <td className="px-4 py-3 text-sm hidden md:table-cell">{c.departement}</td>
                <td className="px-4 py-3 text-sm hidden lg:table-cell">{c.poste}</td>
                <td className="px-4 py-3 text-sm hidden lg:table-cell">{c.telephone}</td>
                <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-muted-foreground" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}