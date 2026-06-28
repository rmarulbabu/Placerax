import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* left brand panel */}
      <div className="relative hidden overflow-hidden bg-surface lg:block">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo />
          </Link>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">
              The workspace where careers are <span className="text-gradient">built</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              AI matching, ATS-grade pipelines, and a premium experience — for students,
              recruiters, and platform teams.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted architecture · JWT + RBAC · Realtime · Built to scale to 100k+ users.
          </p>
        </div>
      </div>

      {/* right form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}
