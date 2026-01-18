import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 container flex items-center justify-between h-16">
        <Logo size="md" />
        <Button 
          variant="ghost" 
          onClick={() => navigate('/auth')}
          className="text-muted-foreground hover:text-foreground"
        >
          Iniciar Sesión
        </Button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 container flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="max-w-2xl mx-auto animate-slide-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground leading-tight">
            Gestiona tus{' '}
            <span className="text-gradient">redes sociales</span>{' '}
            en un solo lugar
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
            Conecta tus cuentas de Instagram y Facebook, analiza métricas y haz crecer tu presencia digital con SportHub.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="sport" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto"
            >
              Comenzar Gratis
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto"
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          <FeatureCard
            emoji="📊"
            title="Analytics en tiempo real"
            description="Visualiza seguidores, likes y comentarios al instante"
          />
          <FeatureCard
            emoji="🔗"
            title="Conexión con Meta"
            description="Integra Instagram y Facebook con un solo clic"
          />
          <FeatureCard
            emoji="📱"
            title="Mobile First"
            description="Diseñado para que lo uses desde cualquier dispositivo"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SportHub. Todos los derechos reservados.
      </footer>
    </div>
  );
};

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 text-center card-hover">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default Index;
