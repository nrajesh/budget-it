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
import { Loader2 } from "lucide-react";

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
          email: data.email || user.email, // Use user.email as fallback
          avatar_url: data.avatar_url || "",
        });
      }
    } else {
      showError("User not logged in.");
    }
    setIsLoading(false);
  }, [form]);

  React.useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
        // Also update auth.users email if it changed
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
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.watch("avatar_url") || "/placeholder.svg"} alt="User Avatar" />
                  <AvatarFallback>
                    {form.watch("first_name")?.charAt(0) || ""}{form.watch("last_name")?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
    </div>
  );
};

export default ProfilePage;