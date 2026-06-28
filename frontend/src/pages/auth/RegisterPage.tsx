import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "./AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { homeForRole } from "@/config/navigation";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const schema = z.object({
  full_name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Must include letters and numbers"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const registerUser = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const user = await registerUser({ ...values, role });
      toast.success("Account created. Welcome to Placera!");
      navigate(user.role === "student" ? "/onboarding" : homeForRole(user.role));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const roles: { value: Role; label: string; icon: typeof GraduationCap; desc: string }[] = [
    { value: "student", label: "Student", icon: GraduationCap, desc: "Find internships & jobs" },
    { value: "recruiter", label: "Recruiter", icon: Briefcase, desc: "Hire top talent" },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Placera in less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
              role === r.value
                ? "border-primary/50 bg-primary/10 shadow-glow"
                : "border-border hover:border-border/80 hover:bg-surface-2",
            )}
          >
            <r.icon className={cn("size-5", role === r.value ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium">{r.label}</span>
            <span className="text-[11px] text-muted-foreground">{r.desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" placeholder="Ada Lovelace" {...register("full_name")} />
          {errors.full_name && <p className="text-xs text-danger">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
