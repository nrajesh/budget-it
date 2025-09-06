"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Upload } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  setIsAvatarModalOpen: (isOpen: boolean) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ setIsAvatarModalOpen }) => {
  const { user, userProfile, isLoadingUser, fetchUserProfile } = useUser();
  const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      avatar_url: "",
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        email: userProfile.email || user?.email || "",
        avatar_url: userProfile.avatar_url || "",
      });
    } else if (!isLoadingUser && !user) {
      profileForm.reset({
        first_name: "",
        last_name: "",
        email: "",
        avatar_url: "",
      });
    }
  }, [userProfile, user, isLoadingUser, profileForm]);

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    if (!user) {
      showError("User not logged in.");
      setIsSubmittingProfile(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_profile")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          avatar_url: values.avatar_url,
          email: values.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      if (user.email !== values.email) {
        const { error: authUpdateError } = await supabase.auth.updateUser({ email: values.email });
        if (authUpdateError) {
          throw authUpdateError;
        }
      }
      showSuccess("Profile updated successfully!");
      fetchUserProfile();
    } catch (error: any) {
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Your Profile</CardTitle>
        <CardDescription>
          Update your personal information and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileForm.watch("avatar_url") || "/placeholder.svg"} alt="User Avatar" />
                  <AvatarFallback>
                    {profileForm.watch("first_name")?.charAt(0) || ""}{profileForm.watch("last_name")?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-background group-hover:scale-105 transition-transform"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Change Avatar</span>
                </Button>
              </div>
            </div>

            <FormField
              control={profileForm.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmittingProfile}>
              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};