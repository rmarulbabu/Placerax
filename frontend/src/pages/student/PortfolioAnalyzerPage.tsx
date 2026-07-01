import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Gauge,
  Github,
  Globe,
  Lightbulb,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api, apiErrorMessage } from "@/lib/api";
import type { PortfolioAnalysis, PortfolioCategoryScores } from "@/types";

const CATEGORY_LABELS: Record<keyof PortfolioCategoryScores, string> = {
  performance: "Performance",
  seo: "SEO",
  accessibility: "Accessibility",
  mobile: "Mobile",
  ux: "UI/UX",
  project_quality: "Project Quality",
};

const urlRe = /^https?:\/\/.+\..+/i;

function toneClass(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-primary";
  return "text-warning";
}
function barClass(score: number) {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-primary";
  return "bg-warning";
}

export default function PortfolioAnalyzerPage() {
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioAnalysis | null>(null);

  const analyze = async () => {
    if (!urlRe.test(portfolioUrl.trim())) {
      toast.error("Enter a valid portfolio URL (https://…).");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<PortfolioAnalysis>("/ai/portfolio-analyze", {
        portfolio_url: portfolioUrl.trim(),
        github_url: githubUrl.trim() || null,
      });
      setResult(data);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const radarData = result
    ? (Object.keys(CATEGORY_LABELS) as (keyof PortfolioCategoryScores)[]).map((key) => ({
        category: CATEGORY_LABELS[key],
        score: result.categories[key],
      }))
    : [];

  return (
    <>
      <PageHeader
        title="AI Portfolio Analyzer"
        description="Analyze your portfolio for performance, SEO, accessibility, mobile, UI/UX, and project quality."
        actions={
          result ? (
            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="size-4" /> Export PDF
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Portfolio URL</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://your-portfolio.com"
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">GitHub URL (optional)</Label>
            <div className="relative">
              <Github className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/you"
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={analyze} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
              Analyze portfolio
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {/* Overall + radar */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center gap-3 p-6">
              <CardTitle>Portfolio Health</CardTitle>
              <ScoreRing value={result.overall_score} size={140} label="Overall" />
              <p className="text-center text-xs text-muted-foreground">
                {result.fetched
                  ? "Analyzed from live page signals."
                  : "Estimated — page could not be fetched directly."}
              </p>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Category Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="hsl(240 6% 50% / 0.3)" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: "hsl(240 5% 55%)", fontSize: 12 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.35}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category score cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(CATEGORY_LABELS) as (keyof PortfolioCategoryScores)[]).map((key) => {
              const score = result.categories[key];
              return (
                <Card key={key} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{CATEGORY_LABELS[key]}</p>
                    <span className={cn("font-mono text-lg font-bold tabular-nums", toneClass(score))}>
                      {score}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className={cn("h-full rounded-full", barClass(score))} style={{ width: `${score}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Priority fixes */}
          {result.priority_fixes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-4 text-warning" /> Priority Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.priority_fixes.map((fix, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-warning/20 text-[11px] font-bold text-warning">
                        {i + 1}
                      </span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Strengths + weaknesses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.weaknesses.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No major weaknesses detected. 🎉</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" /> Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-surface-2/40 p-3">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
