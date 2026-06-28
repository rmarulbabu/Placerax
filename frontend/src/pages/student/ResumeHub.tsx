import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ScoreRing } from "@/components/common/ScoreRing";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, apiErrorMessage } from "@/lib/api";

interface ResumeAnalysis {
  score: number;
  ats_score: number;
  strengths: string[];
  improvements: string[];
  missing_keywords: string[];
}
interface Resume {
  id: string;
  file_name: string;
  is_active: boolean;
  analysis: ResumeAnalysis;
}

export default function ResumeHub() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get<Resume[]>("/resumes")).data,
  });

  const active = resumes?.find((r) => r.is_active) ?? resumes?.[0];

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<Resume>("/resumes", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await api.post(`/resumes/${data.id}/activate`);
      qc.invalidateQueries({ queryKey: ["resumes"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "student"] });
      toast.success("Resume analyzed and set active.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Resume & ATS"
        description="AI analysis, ATS compatibility, and tailored improvements."
        actions={
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            Upload resume
          </Button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />

      {!active ? (
        <EmptyState
          icon={FileUp}
          title="No resume uploaded"
          description="Upload your resume to get an instant AI score and ATS compatibility report."
          action={
            <Button onClick={() => fileRef.current?.click()} className="mt-2">
              Upload now
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Resume score</CardTitle>
            </CardHeader>
            <CardContent className="grid place-items-center gap-2">
              <ScoreRing value={active.analysis.score} label="Quality" size={150} />
              <p className="text-xs text-muted-foreground">{active.file_name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ATS compatibility</CardTitle>
            </CardHeader>
            <CardContent className="grid place-items-center">
              <ScoreRing value={active.analysis.ats_score} label="ATS" size={150} />
            </CardContent>
          </Card>

          <Card className="lg:row-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium text-success">
                  <CheckCircle2 className="size-4" /> Strengths
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {active.analysis.strengths.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium text-warning">
                  <TriangleAlert className="size-4" /> Improvements
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {active.analysis.improvements.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
              {active.analysis.missing_keywords.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Missing keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {active.analysis.missing_keywords.map((k) => (
                      <Badge key={k} variant="danger" className="capitalize">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
