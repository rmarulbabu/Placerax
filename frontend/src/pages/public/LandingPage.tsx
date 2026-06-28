import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  FileSearch,
  GraduationCap,
  KanbanSquare,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: FileSearch, title: "AI Resume & ATS Score", desc: "Instant resume analysis, ATS compatibility, and tailored improvements." },
  { icon: Zap, title: "One-Click Apply", desc: "Apply in a tap with smart match scoring against every role." },
  { icon: KanbanSquare, title: "ATS-grade Pipeline", desc: "Lever-style Kanban hiring pipeline with ranking and notes." },
  { icon: Bot, title: "AI Career Assistant", desc: "Skill-gap analysis, mock interviews, and roadmap generation." },
  { icon: BarChart3, title: "Hiring Analytics", desc: "Funnels, growth, and revenue metrics in a premium dashboard." },
  { icon: ShieldCheck, title: "Verified & Moderated", desc: "Recruiter verification, company approval, and job moderation." },
];

const stats = [
  { value: "100k+", label: "Built to scale" },
  { value: "3", label: "Role workspaces" },
  { value: "<15min", label: "Token lifetime" },
  { value: "Realtime", label: "WebSocket updates" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* gradient mesh + grid */}
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />

      {/* nav */}
      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge variant="default" className="mx-auto mb-6 inline-flex gap-1.5">
            <Sparkles className="size-3.5" /> Internships · Placements · ATS — reimagined
          </Badge>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Where talent meets <span className="text-gradient">opportunity</span>, intelligently.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Placera is the venture-scale platform that pairs students with recruiters through
            AI-powered matching, a Lever-grade ATS, and a premium workspace experience.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/register">
                <GraduationCap className="size-5" /> Start as a student
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">I'm hiring talent</Link>
            </Button>
          </div>
        </motion.div>

        {/* product preview frame */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="glass overflow-hidden rounded-2xl p-2 shadow-glow">
            <div className="rounded-xl border border-white/[0.06] bg-surface">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-danger/70" />
                <span className="h-3 w-3 rounded-full bg-warning/70" />
                <span className="h-3 w-3 rounded-full bg-success/70" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">app.placera.io/student</span>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl glass-2 p-4 text-left">
                    <p className="font-display text-2xl font-bold text-gradient">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
                <div className="rounded-xl glass-2 p-4 text-left">
                  <p className="font-display text-2xl font-bold text-gradient">PWA</p>
                  <p className="text-xs text-muted-foreground">Installable, offline-ready</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass group rounded-xl p-6 transition-colors hover:bg-surface-2/40"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Placera. Built to scale.</p>
        </div>
      </footer>
    </div>
  );
}
