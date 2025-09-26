import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const avatarFormSchema = z.object({
  avatar_url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

type AvatarFormData = z.infer<typeof avatarFormSchema>;

interface AvatarModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { user } = useUser();
  const [isSavingAvatar, setIsSavingAvatar] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AvatarFormData>({
    resolver: zodResolver(avatarFormSchema),
    defaultValues: {
      avatar_url: '',
    },
  });

  React.useEffect(() => {
    if (user && isOpen) {
      form.setValue("avatar_url", user.avatar_url || '');
    }
  }, [user, isOpen, form]);

  const handleAvatarSubmit = async (values: AvatarFormData) => {
    if (!user) return;
    setIsSavingAvatar(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: values.avatar_url })
        .eq('id', user.id);
      if (error) throw error;

      showSuccess('Avatar updated successfully!');
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      onOpenChange(false);
    } catch (error: any) {
      showError(`Error updating avatar: ${error.message}`);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAvatarSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSavingAvatar}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingAvatar}>
                {isSavingAvatar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};