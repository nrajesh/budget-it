"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

// Import the new modular components
import { ProfileForm } from "@/components/profile/ProfileForm.tsx";
import { AvatarModal } from "@/components/profile/AvatarModal.tsx";

// Define the schema for the avatar_url field, as it's the only part of profileForm we need here
const avatarUrlSchema = z.object({
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});
type AvatarUrlFormValues = z.infer<typeof avatarUrlSchema>;

const ProfilePage = () => {
  const { user, isLoadingUser } = useUser();

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


  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
        <ProfileForm setIsAvatarModalOpen={setIsAvatarModalOpen} />
        {/* Password form removed for local mode */}
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        {/* Account Actions (Logout) removed for local mode */}
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