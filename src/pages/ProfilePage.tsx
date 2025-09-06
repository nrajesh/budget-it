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
import { Loader2, Upload, Image as ImageIcon, Link as LinkIcon, XCircle, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext"; // Import useUser
import { useNavigate } from "react-router-dom"; // Import useNavigate

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const ProfilePage = () => {
  const { user, userProfile, isLoadingUser, fetchUserProfile } = useUser(); // Use user context
  const navigate = useNavigate();

  const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = React.useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [avatarOption, setAvatarOption] = React.useState<"url" | "upload">("url");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = React.useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      avatar_url: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Populate profile form when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        email: userProfile.email || user?.email || "",
        avatar_url: userProfile.avatar_url || "",
      });
      setCurrentAvatarUrl(userProfile.avatar_url);
    } else if (!isLoadingUser && !user) {
      // If not loading and no user, reset form to empty
      profileForm.reset({
        first_name: "",
        last_name: "",
        email: "",
        avatar_url: "",
      });
      setCurrentAvatarUrl(null);
    }
  }, [userProfile, user, isLoadingUser, profileForm]);

  const uploadAvatar = React.useCallback(async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }, []);

  const deleteOldAvatar = React.useCallback(async (oldAvatarUrl: string, userId: string) => {
    if (!oldAvatarUrl || oldAvatarUrl.includes("/placeholder.svg")) return;

    try {
      const urlParts = oldAvatarUrl.split('/');
      const bucketName = urlParts[urlParts.indexOf('storage') + 1]; // 'avatars'
      const pathSegments = urlParts.slice(urlParts.indexOf(bucketName) + 1);
      const filePath = pathSegments.join('/');

      if (filePath.startsWith(`${userId}/`)) { // Ensure we only delete user's own files
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        if (deleteError) {
          console.error("Error deleting old avatar:", deleteError.message);
        }
      }
    } catch (error) {
      console.error("Error parsing old avatar URL for deletion:", error);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSaveAvatar = async () => {
    setIsSubmittingProfile(true);
    if (!user) {
      showError("User not logged in.");
      setIsSubmittingProfile(false);
      return;
    }

    let newAvatarUrl = profileForm.getValues("avatar_url"); // Get current URL from form state

    try {
      if (avatarOption === "upload" && selectedFile) {
        // If uploading a new file, delete old one if it was an uploaded file
        if (currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
        newAvatarUrl = await uploadAvatar(selectedFile, user.id);
      } else if (avatarOption === "url" && newAvatarUrl !== currentAvatarUrl) {
        // If URL changed in input, and old was an uploaded file, delete it
        if (currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
      } else if (avatarOption === "url" && !newAvatarUrl && currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
        // If avatar_url is cleared and old was an uploaded file, delete it
        await deleteOldAvatar(currentAvatarUrl, user.id);
      }

      // Now, update the user_profile table with the determined newAvatarUrl
      const { error: updateProfileError } = await supabase
        .from("user_profile")
        .update({
          avatar_url: newAvatarUrl || null, // Store null if empty string
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateProfileError) {
        throw updateProfileError;
      }

      profileForm.setValue("avatar_url", newAvatarUrl || ""); // Update form state
      setCurrentAvatarUrl(newAvatarUrl); // Update local state for current avatar
      setIsAvatarModalOpen(false);
      showSuccess("Avatar updated successfully!");
      fetchUserProfile(); // Re-fetch profile to update Layout and other components
    } catch (error: any) {
      showError(`Failed to update avatar: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

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
          email: values.email, // Update email in profile table
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Update email in auth.users if it changed
      if (user.email !== values.email) {
        const { error: authUpdateError } = await supabase.auth.updateUser({ email: values.email });
        if (authUpdateError) {
          throw authUpdateError;
        }
      }
      showSuccess("Profile updated successfully!");
      fetchUserProfile(); // Re-fetch profile to update Layout and other components
    } catch (error: any) {
      showError(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setIsSubmittingPassword(true);
    if (!user) {
      showError("User not logged in.");
      setIsSubmittingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        throw error;
      }

      showSuccess("Password updated successfully!");
      passwordForm.reset(); // Clear password fields
    } catch (error: any) {
      showError(`Failed to update password: ${error.message}`);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login"); // Redirect to login page after logout
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

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Perform other account-related actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="url" className="w-full" onValueChange={(value) => setAvatarOption(value as "url" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">
                <LinkIcon className="mr-2 h-4 w-4" /> Use URL
              </TabsTrigger>
            <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" /> Upload File
              </TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="mt-4 space-y-4">
              <div>
                <label htmlFor="avatar-url-input" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Avatar URL</label>
                <Input
                  id="avatar-url-input"
                  placeholder="https://example.com/avatar.jpg"
                  value={profileForm.watch("avatar_url") || ""}
                  onChange={(e) => profileForm.setValue("avatar_url", e.target.value)}
                  className="mt-2"
                />
              </div>
              {profileForm.watch("avatar_url") && (
                <div className="relative w-24 h-24 mx-auto">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={profileForm.watch("avatar_url")} alt="Avatar Preview" />
                    <AvatarFallback>URL</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
                    onClick={() => profileForm.setValue("avatar_url", "")}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Clear URL</span>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-4 space-y-4">
              <div>
                <label htmlFor="avatar-upload-input" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Upload Image</label>
                <Input id="avatar-upload-input" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
              </div>
              {filePreview && (
                <div className="relative w-24 h-24 mx-auto">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={filePreview} alt="File Preview" />
                    <AvatarFallback>File</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Clear File</span>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAvatar} disabled={isSubmittingProfile || (avatarOption === "upload" && !selectedFile)}>
              {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;