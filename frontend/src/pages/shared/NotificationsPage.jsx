import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Centre de notifications</h1>
      </div>
      <p className="text-muted-foreground">Aucune notification pour le moment.</p>
    </div>
  );
}