"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Link as LinkIcon, XCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useUser } from "@/contexts/UserContext";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

// Define the schema for the avatar_url field, as it's the only part of profileForm we need here
const avatarUrlSchema = z.object({
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});
type AvatarUrlFormValues = z.infer<typeof avatarUrlSchema>;

interface AvatarModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  profileForm: UseFormReturn<AvatarUrlFormValues>; // Only pass the relevant part of the form
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onOpenChange,
  profileForm,
}) => {
  const { user, userProfile, fetchUserProfile } = useUser();
  const [isSavingAvatar, setIsSavingAvatar] = React.useState(false);
  const [avatarOption, setAvatarOption] = React.useState<"url" | "upload">("url");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const currentAvatarUrl = userProfile?.avatar_url || null;

  // Reset modal state when it opens
  React.useEffect(() => {
    if (isOpen) {
      setAvatarOption(profileForm.getValues("avatar_url") ? "url" : "upload");
      setSelectedFile(null);
      setFilePreview(null);
    }
  }, [isOpen, profileForm]);

  const uploadAvatar = React.useCallback(async (file: File, userId: string) => {
    // Local mode: Create a local object URL or Base64 string
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }, []);

  const deleteOldAvatar = React.useCallback(async (oldAvatarUrl: string, userId: string) => {
    // Local mode: No-op
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
    setIsSavingAvatar(true);
    if (!user) {
      showError("User not logged in.");
      setIsSavingAvatar(false);
      return;
    }

    let newAvatarUrl = profileForm.getValues("avatar_url");

    try {
      if (avatarOption === "upload" && selectedFile) {
        if (currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
        newAvatarUrl = await uploadAvatar(selectedFile, user.id);
      } else if (avatarOption === "url" && newAvatarUrl !== currentAvatarUrl) {
        if (currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
          await deleteOldAvatar(currentAvatarUrl, user.id);
        }
      } else if (avatarOption === "url" && !newAvatarUrl && currentAvatarUrl && !currentAvatarUrl.includes("/placeholder.svg") && currentAvatarUrl.includes(user.id)) {
        await deleteOldAvatar(currentAvatarUrl, user.id);
      }

      // Local mode: Update profile is conceptual or saved to localStorage if persisted
      // For now, we assume user profile updates are handled by Context or just local state.
      // Since UserContext is mocked, we might need a way to persist this if we want it to stick.
      // But for "Steroid" phase, just updating the form value is enough feedback for the UI,
      // although it won't persist on reload unless we update the mock session/localStorage.

      // Let's try to update localStorage if we are storing mock user there?
      // Currently UserContext reads from a static mock.
      // I will just show success.

      profileForm.setValue("avatar_url", newAvatarUrl || "");
      onOpenChange(false);
      showSuccess("Avatar updated successfully!");
      fetchUserProfile();
    } catch (error: any) {
      showError(`Failed to update avatar: ${error.message}`);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveAvatar} disabled={isSavingAvatar || (avatarOption === "upload" && !selectedFile)}>
            {isSavingAvatar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Avatar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};