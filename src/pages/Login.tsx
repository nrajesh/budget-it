import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
function Login() {
  // Other code here
  return (
    <Auth
      supabaseClient={supabase}
      providers={[]}
      appearance={{
        theme: ThemeSupa,
      }}
      theme="light"
    />
  );
}