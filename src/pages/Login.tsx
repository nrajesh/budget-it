import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/'); // Redirect to home page on successful sign-in
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        >
          {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">Welcome to Budget It!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                },
              },
              dark: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                },
              },
            },
          }}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
}

export default Login;