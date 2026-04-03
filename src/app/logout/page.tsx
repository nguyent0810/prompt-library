"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // Sign out and let NextAuth redirect back to "/"
    signOut({ callbackUrl: "/" });
  }, []);

  return null;
}

