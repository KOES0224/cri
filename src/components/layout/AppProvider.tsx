"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // reducedMotion="user": framer-motion animations are skipped when the OS asks for reduced motion.
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SessionProvider>
  );
}
