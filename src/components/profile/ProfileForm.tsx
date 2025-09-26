import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  setIsAvatarModalOpen: (isOpen: boolean) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ setIsAvatarModalOpen }) => {
  const { user, isLoadingUser } = useUser();
  const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user, form]);

  const handleProfileSubmit = async (values: ProfileFormData) => {
    if (!user) return;
    setIsSubmittingProfile(true);
    try {
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: values.full_name },
      });
      if (userError) throw userError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: values.full_name })
        .eq('id', user.id);
      if (profileError) throw profileError;

      showSuccess('Profile updated successfully!');
      await queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error: any) {
      showError(`Error updating profile: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmittingProfile || isLoadingUser}>
          {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
};