import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocialConnections } from '@/hooks/use-social-connections';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MetaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useSocialConnections();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Conectando tu cuenta...');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'El usuario canceló la autorización');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Parámetros de autorización inválidos');
        return;
      }

      const result = await handleCallback(code, state);

      if (result.success) {
        setStatus('success');
        setMessage('¡Cuenta conectada exitosamente!');
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Error al conectar la cuenta');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full mx-4 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Conectando
            </h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              ¡Éxito!
            </h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error
            </h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="space-y-2">
              <Button
                variant="sport"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Volver al Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
