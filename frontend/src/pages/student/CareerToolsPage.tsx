import { useState } from "react";
import { Bot, Brain, Loader2, Map, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api, apiErrorMessage } from "@/lib/api";

type Mode = "skill-gap" | "roadmap" | "assistant";

const meta: Record<Mode, { title: string; desc: string; icon: typeof Brain }> = {
  "skill-gap": { title: "Skill Gap Analysis", desc: "See how your skills stack up against a target role.", icon: Brain },
  roadmap: { title: "Career Roadmap", desc: "Generate a phased plan to reach your target role.", icon: Map },
  assistant: { title: "AI Assistant", desc: "Ask anything about your placement journey.", icon: Bot },
};

export default function CareerToolsPage({ mode }: { mode: Mode }) {
  const m = meta[mode];
  const [input, setInput] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [gap, setGap] = useState<{ coverage: number; matched: string[]; missing: string[] } | null>(null);
  const [roadmap, setRoadmap] = useState<{ phases: { phase: string; focus: string[]; milestone: string }[] } | null>(null);
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const runSkillGap = async () => {
    const skills = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (!skills.length) return;
    setLoading(true);
    try {
      const { data } = await api.post("/ai/skill-gap", { target_skills: skills });
      setGap(data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runRoadmap = async () => {
    const skills = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (!role) return;
    setLoading(true);
    try {
      const { data } = await api.post("/ai/roadmap", { target_role: role, target_skills: skills });
      setRoadmap(data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const sendChat = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChat((c) => [...c, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setChat((c) => [
        ...c,
        {
          role: "ai",
          text: "Great question! Based on your profile, focus on quantifying your projects, applying to 5+ matched roles this week, and completing a mock interview. I can draft a tailored plan whenever you're ready.",
        },
      ]);
    }, 500);
  };

  return (
    <>
      <PageHeader title={m.title} description={m.desc} />

      {mode === "skill-gap" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
              <Input
                placeholder="Target skills, comma-separated (e.g. python, docker, kubernetes)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={runSkillGap} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
                Analyze
              </Button>
            </CardContent>
          </Card>

          {gap && (
            <Card>
              <CardHeader>
                <CardTitle>Coverage: {gap.coverage}%</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={gap.coverage} />
                <div>
                  <p className="mb-2 text-sm font-medium text-success">You already have</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.matched.length ? (
                      gap.matched.map((s) => (
                        <Badge key={s} variant="success" className="capitalize">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No overlap yet.</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-warning">Skills to learn</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gap.missing.map((s) => (
                      <Badge key={s} variant="warning" className="capitalize">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {mode === "roadmap" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <Input placeholder="Target role (e.g. Backend Engineer)" value={role} onChange={(e) => setRole(e.target.value)} />
              <Input placeholder="Target skills, comma-separated" value={input} onChange={(e) => setInput(e.target.value)} />
              <Button onClick={runRoadmap} disabled={loading} className="self-start">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Generate roadmap
              </Button>
            </CardContent>
          </Card>

          {roadmap && (
            <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-full before:w-px before:bg-border">
              {roadmap.phases.map((p, i) => (
                <div key={i} className="relative flex gap-4 pl-0">
                  <div className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <Card className="flex-1 p-4">
                    <p className="font-display font-semibold">{p.phase}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.focus.map((f) => (
                        <Badge key={f} variant="muted">
                          {f}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">🎯 {p.milestone}</p>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "assistant" && (
        <Card className="flex h-[60vh] flex-col">
          <CardContent className="flex-1 space-y-3 overflow-y-auto pt-6">
            {!chat.length && (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <Bot className="mx-auto mb-2 size-8 text-primary" />
                  Ask about resumes, interviews, or your placement plan.
                </div>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-brand px-4 py-2 text-sm text-white"
                      : "max-w-[80%] rounded-2xl rounded-bl-sm glass-2 px-4 py-2 text-sm"
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="flex gap-2 border-t border-white/[0.06] p-3">
            <Input
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <Button size="icon" onClick={sendChat}>
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
