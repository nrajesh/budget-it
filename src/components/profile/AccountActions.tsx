"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut } from "lucide-react";

interface AccountActionsProps {
  onLogout: () => void;
}

export const AccountActions: React.FC<AccountActionsProps> = ({ onLogout }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>
          Perform other account-related actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </CardContent>
    </Card>
  );
};
