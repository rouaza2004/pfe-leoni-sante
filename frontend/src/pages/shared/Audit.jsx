import { auditLogs } from '@/data/mock';
import { Shield } from 'lucide-react';

export default function Audit() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Journal d'Audit</h1>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b bg-muted/30">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Utilisateur</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Détails</th>
          </tr></thead>
          <tbody>{auditLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
            <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(log.date).toLocaleString('fr-FR')}</td>
              <td className="px-4 py-3"><span className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">{log.action}</span></td>
              <td className="px-4 py-3 text-sm">{log.userName}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{log.details}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}