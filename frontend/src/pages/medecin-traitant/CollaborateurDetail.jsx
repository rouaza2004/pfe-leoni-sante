import { useParams, useNavigate } from 'react-router-dom';
import { collaborateurs } from '@/data/mock';
import { ArrowLeft } from 'lucide-react';

export default function CollaborateurDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collab = collaborateurs.find(c => String(c.id) === String(id));

  if (!collab) return <div className="p-8 text-center">Collaborateur non trouvé</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/collaborateurs')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="bg-card rounded-xl border p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
          {collab.prenom[0]}{collab.nom[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{collab.prenom} {collab.nom}</h1>
          <p className="text-sm text-muted-foreground">{collab.poste} · {collab.departement}</p>
          <p className="text-xs text-muted-foreground mt-1">{collab.matricule} · {collab.email} · {collab.telephone}</p>
        </div>
      </div>
    </div>
  );
}