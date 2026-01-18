import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
          toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente' });
          navigate('/dashboard');
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden' });
          return;
        }
        if (password.length < 6) {
          toast({ variant: 'destructive', title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres' });
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
          toast({ title: '¡Cuenta creada!', description: 'Tu cuenta ha sido creada exitosamente' });
          navigate('/dashboard');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
          toast({ title: 'Email enviado', description: 'Revisa tu correo para restablecer tu contraseña' });
          setMode('login');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <Logo size="xl" />
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-6">
            {mode === 'forgot' && (
              <button 
                onClick={() => switchMode('login')} 
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Volver</span>
              </button>
            )}
            <h1 className="text-2xl font-display font-bold text-foreground">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'register' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {mode === 'login' && 'Ingresa a tu cuenta de SportHub'}
              {mode === 'register' && 'Únete a SportHub y gestiona tus redes'}
              {mode === 'forgot' && 'Te enviaremos un email para restablecer tu contraseña'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              variant="sport" 
              size="lg" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  {mode === 'login' && 'Iniciar Sesión'}
                  {mode === 'register' && 'Crear Cuenta'}
                  {mode === 'forgot' && 'Enviar Email'}
                </>
              )}
            </Button>
          </form>

          {/* Switch mode */}
          {mode !== 'forgot' && (
            <div className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-muted-foreground">
                  ¿No tienes cuenta?{' '}
                  <button 
                    onClick={() => switchMode('register')} 
                    className="text-primary font-medium hover:underline"
                  >
                    Regístrate
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <button 
                    onClick={() => switchMode('login')} 
                    className="text-primary font-medium hover:underline"
                  >
                    Inicia Sesión
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          SportHub - Gestión de redes sociales para deportes
        </p>
      </div>
    </div>
  );
}
