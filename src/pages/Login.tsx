import React, { useEffect, useMemo } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';

const NO_PROVIDERS: [] = [];

function Login() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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

  const appearance = useMemo(() => ({
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: 'hsl(var(--primary))',
          brandAccent: 'hsl(var(--primary) / 0.9)',
          brandButtonText: 'hsl(var(--primary-foreground))',
          defaultButtonBackground: 'hsl(var(--secondary))',
          defaultButtonBackgroundHover: 'hsl(var(--secondary) / 0.9)',
          defaultButtonBorder: 'hsl(var(--border))',
          defaultButtonText: 'hsl(var(--secondary-foreground))',
          dividerBackground: 'hsl(var(--border))',
          inputBackground: 'hsl(var(--input))',
          inputBorder: 'hsl(var(--border))',
          inputBorderHover: 'hsl(var(--ring))',
          inputBorderFocus: 'hsl(var(--ring))',
          inputText: 'hsl(var(--foreground))',
          inputLabelText: 'hsl(var(--muted-foreground))',
          inputPlaceholder: 'hsl(var(--muted-foreground))',
          messageText: 'hsl(var(--muted-foreground))',
          messageTextDanger: 'hsl(var(--destructive))',
          anchorTextColor: 'hsl(var(--foreground))',
          anchorTextHoverColor: 'hsl(var(--primary))',
        },
      },
    },
  }), []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <Moon className="size-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">Welcome to Budget It!</h2>
        <Auth
          supabaseClient={supabase}
          providers={NO_PROVIDERS}
          appearance={appearance}
        />
      </div>
    </div>
  );
}

export default Login;