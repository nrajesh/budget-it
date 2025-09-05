import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { MadeWithDyad } from '@/components/made-with-dyad'; // Import MadeWithDyad

function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome to Budgeting App</h1>
        <div className="p-8 border rounded-lg shadow-lg bg-card">
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers for now
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Use light theme, can be dynamic based on app theme
          />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
}

export default Login;