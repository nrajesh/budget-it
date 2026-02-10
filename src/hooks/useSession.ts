"use client";

import { useState } from "react";

// Mock Session interface to satisfy TS consumers
export interface Session {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

export const useSession = () => {
  const [session, _setSession] = useState<Session | null>({
    user: {
      id: "local-user",
      email: "local@user.com",
      user_metadata: {
        full_name: "Local User",
      },
    },
  });

  return session;
};
