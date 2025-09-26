import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AvatarModal } from '@/components/profile/AvatarModal';

const avatarFormSchema = z.object({
  avatar_url: z.string().url().optional().or(z.literal('')),
});

type AvatarFormData = z.infer<typeof avatarFormSchema>;

const ProfilePage = () => {
  const { user, isLoadingUser } = useUser();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);

  const avatarForm = useForm<AvatarFormData>({
    resolver: zodResolver(avatarFormSchema),
    defaultValues: {
      avatar_url: '',
    },
  });

  React.useEffect(() => {
    if (user?.avatar_url) {
      avatarForm.setValue("avatar_url", user.avatar_url);
    }
  }, [user, avatarForm]);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoadingUser) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Profile</h2>
        <p className="text-muted-foreground">
          Manage your account settings and personal information.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name || 'User'} />
                <AvatarFallback className="text-4xl">{getInitials(user?.full_name)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={() => setIsAvatarModalOpen(true)}>
                Change Avatar
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm setIsAvatarModalOpen={setIsAvatarModalOpen} />
            </CardContent>
          </Card>
        </div>
      </div>
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onOpenChange={setIsAvatarModalOpen}
      />
    </div>
  );
};

export default ProfilePage;