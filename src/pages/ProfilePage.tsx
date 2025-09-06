"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

// Import the new modular components
import { ProfileForm } from "@/components/profile/ProfileForm.tsx";
import { PasswordForm } from "@/components/profile/PasswordForm.tsx";
import { AvatarModal } from "@/components/profile/AvatarModal.tsx";
import { AccountActions } from "@/components/profile/AccountActions.tsx";

// Define the schema for the avatar_url field, as it's the only part of profileForm we need here
const avatarUrlSchema = z.object({
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});
type AvatarUrlFormValues = z.infer<typeof avatarUrlSchema>;

const ProfilePage = () => {
  const { user, isLoadingUser } = useUser();
  const navigate = useNavigate();

  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);

  // This form instance is specifically for managing the avatar_url field
  // and passing it to the AvatarModal. The ProfileForm component will have its own form instance.
  const avatarForm = useForm<AvatarUrlFormValues>({
    resolver: zodResolver(avatarUrlSchema),
    defaultValues: {
      avatar_url: "",
    },
  });

  // Update avatarForm's avatar_url when userProfile changes
  React.useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      avatarForm.setValue("avatar_url", user.user_metadata.avatar_url);
    }
  }, [user, avatarForm]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] space-y-4">
        <h2 className="text-2xl font-bold">Please Log In</h2>
        <p className="text-muted-foreground">You need to be logged in to view your profile settings.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
        <ProfileForm setIsAvatarModalOpen={setIsAvatarModalOpen} />
        <PasswordForm />
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        <AccountActions onLogout={handleLogout} />
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onOpenChange={setIsAvatarModalOpen}
        profileForm={avatarForm}
      />
    </div>
  );
};

export default ProfilePage;