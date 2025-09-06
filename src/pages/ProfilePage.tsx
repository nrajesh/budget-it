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
import { Loader2, Upload, Image as ImageIcon, Link as LinkIcon, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [avatarOption, setAvatarOption] = React.useState<"url" | "upload">("url");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = React.useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      avatar_url: "",
    },
  });

  const fetchUserProfile = React.useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("user_profile")
        .select("first_name, last_name, avatar_url, email")
        .eq("id", user.id)
        .single();

      if (error) {
        showError(`Failed to fetch profile: ${error.message}`);
      } else if (data) {
        form.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || user.email,
          avatar_url: data.avatar_url || "",
        });
        setCurrentAvatarUrl(data.avatar_url);
      }
    } else {
      showError("User not logged in.");
    }
    setIsLoading(false);
  }, [form]);

  React.useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
      const fileName = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];

      if (folderName === userId) {
        const filePath = `${folderName}/${fileName}`;
        const { error: deleteError } = await supabase.storage
          .from('avatars')
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
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("User not logged in.");
      setIsSubmitting(false);
      return;
    }

    let newAvatarUrl = form.getValues("avatar_url");

    try {
      if (avatarOption === "upload" && selectedFile) {
        if (currentAvatarUrl) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
        newAvatarUrl = await uploadAvatar(selectedFile, user.id);
      } else if (avatarOption === "url" && newAvatarUrl !== currentAvatarUrl) {
        // If URL changed, and old was an uploaded file, delete it
        if (currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
      } else if (avatarOption === "url" && !newAvatarUrl && currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
        // If avatar_url is cleared and old was an uploaded file, delete it
        await deleteOldAvatar(currentAvatarUrl, user.id);
      }

      form.setValue("avatar_url", newAvatarUrl || "");
      setCurrentAvatarUrl(newAvatarUrl);
      setIsAvatarModalOpen(false);
      showSuccess("Avatar updated successfully!");
    } catch (error: any) {
      showError(`Failed to update avatar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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
        showError(`Failed to update profile: ${error.message}`);
      } else {
        if (user.email !== values.email) {
          const { error: authUpdateError } = await supabase.auth.updateUser({ email: values.email });
          if (authUpdateError) {
            showError(`Failed to update auth email: ${authUpdateError.message}`);
          }
        }
        showSuccess("Profile updated successfully!");
      }
    } else {
      showError("User not logged in.");
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>
            Update your personal information and avatar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={form.watch("avatar_url") || "/placeholder.svg"} alt="User Avatar" />
                    <AvatarFallback>
                      {form.watch("first_name")?.charAt(0) || ""}{form.watch("last_name")?.charAt(0) || ""}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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
              {/* Removed FormField and FormMessage, directly using Input */}
              <div>
                <FormLabel>Avatar URL</FormLabel>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  value={form.watch("avatar_url") || ""}
                  onChange={(e) => form.setValue("avatar_url", e.target.value)}
                />
              </div>
              {form.watch("avatar_url") && (
                <div className="relative w-24 h-24 mx-auto">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={form.watch("avatar_url")} alt="Avatar Preview" />
                    <AvatarFallback>URL</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background"
                    onClick={() => form.setValue("avatar_url", "")}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Clear URL</span>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="upload" className="mt-4 space-y-4">
              {/* Removed FormItem and FormMessage, directly using label and Input */}
              <div>
                <FormLabel>Upload Image</FormLabel>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
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
            <Button onClick={handleSaveAvatar} disabled={isSubmitting || (avatarOption === "upload" && !selectedFile)}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;