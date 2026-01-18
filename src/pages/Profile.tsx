import { useState } from 'react';
import { User, Mail, Shield, Calendar, Camera, Save, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - replace with actual Supabase update
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setIsEditing(false);
    toast({
      title: 'Perfil actualizado',
      description: 'Tus cambios han sido guardados',
    });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu información personal
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSave} variant="sport" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Cover / Avatar section */}
          <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-xl bg-primary/20 border-4 border-card flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="pt-14 p-6 space-y-6">
            {/* Role badge */}
            {user.role === 'superadmin' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Super Administrador
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={isEditing ? formData.fullName : user.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">El email no puede ser modificado</p>
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <div className="flex items-center gap-2 h-10 px-3 bg-muted rounded-lg text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground capitalize">{user.role}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Miembro desde</Label>
                <div className="flex items-center gap-2 h-10 px-3 bg-muted rounded-lg text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone for Super Admin */}
        {user.role === 'superadmin' && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              Panel de Administración
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Como superadministrador, tienes acceso completo a todas las funciones del sistema.
            </p>
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Gestionar Usuarios
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
