/**
 * UI Component for prompting the user for a password.
 * Used for both encryption (confirming password) and decryption.
 */

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface PasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (password: string) => void;
  title: string;
  description: string;
  confirmText?: string;
  isEncryptionMode?: boolean; // If true, might ask for confirmation (optional, skipping for simplicity)
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const resolvedConfirmText =
    confirmText ||
    t("dialogs.password.confirm", {
      defaultValue: "Confirm",
    });

  const handleConfirm = () => {
    if (password) {
      onConfirm(password);
      setPassword(""); // Clear for next use
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="password">
            {t("dialogs.password.label", { defaultValue: "Password" })}
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("dialogs.password.placeholder", {
              defaultValue: "Enter password",
            })}
            className="mt-2"
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {t("dialogs.common.cancel", { defaultValue: "Cancel" })}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!password}>
            {resolvedConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PasswordDialog;
