import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const steps = ["About you", "Skills", "Preferences"];
const POPULAR = ["python", "react", "javascript", "typescript", "node", "fastapi", "sql", "aws", "docker", "ml"];
const JOB_TYPES = ["internship", "full_time", "part_time", "contract"];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>(["internship"]);

  const addSkill = (s: string) => {
    const v = s.trim().toLowerCase();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillInput("");
  };

  const canNext =
    step === 0 ? headline.length > 2 && location.length > 1 : step === 1 ? skills.length > 0 : true;

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/profiles/student/onboarding", {
        headline,
        location,
        skills,
        education: [],
        preferences: { roles: [], locations: [], job_types: jobTypes },
      });
      if (user) setUser({ ...user, onboarding_completed: true });
      toast.success("Profile ready. Let's find you opportunities!");
      navigate("/student");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
        <Logo />

        {/* progress rail */}
        <div className="mt-10 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                  i < step
                    ? "bg-gradient-brand text-white"
                    : i === step
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 rounded", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display text-3xl font-bold">{steps[step]}</h1>

              {step === 0 && (
                <div className="mt-6 space-y-4">
                  <p className="text-muted-foreground">Tell us who you are so we can personalize your workspace.</p>
                  <div className="space-y-1.5">
                    <Label>Headline</Label>
                    <Input
                      placeholder="CS senior · full-stack & ML"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input
                      placeholder="Bengaluru, IN"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="mt-6 space-y-4">
                  <p className="text-muted-foreground">Add your strongest skills — these power your recommendations.</p>
                  <Input
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Badge key={s} variant="default" className="gap-1">
                        {s}
                        <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Popular</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR.filter((p) => !skills.includes(p)).map((p) => (
                        <button
                          key={p}
                          onClick={() => addSkill(p)}
                          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 space-y-4">
                  <p className="text-muted-foreground">What are you looking for?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {JOB_TYPES.map((t) => {
                      const active = jobTypes.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            setJobTypes(active ? jobTypes.filter((x) => x !== t) : [...jobTypes, t])
                          }
                          className={cn(
                            "rounded-xl border p-4 text-left text-sm font-medium capitalize transition-all",
                            active
                              ? "border-primary/50 bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-surface-2",
                          )}
                        >
                          {t.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Finish setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
