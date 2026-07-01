import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import type { NotificationSettings, PrivacySettings, SessionInfo, Theme, User } from "@/types";

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  application_updates: true,
  interview_alerts: true,
};
const DEFAULT_PRIVACY: PrivacySettings = {
  profile_visibility: "recruiters",
  portfolio_visibility: "public",
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <>
      <PageHeader title="Settings" description="Manage your account, appearance, and privacy." />
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="account">
            <UserCog className="mr-1.5 size-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-1.5 size-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-1.5 size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="mr-1.5 size-4" /> Privacy
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-1.5 size-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSection user={user} onUpdated={setUser} />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSection user={user} onUpdated={setUser} />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacySection user={user} onUpdated={setUser} />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection
            onLogoutAll={async () => {
              try {
                await api.post("/auth/logout-all");
              } catch {
                /* ignore — proceed to local logout */
              }
              await logout();
              navigate("/login");
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ------------------------------- Account ------------------------------- */
function AccountSection({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!fullName.trim()) return toast.error("Full name is required.");
    if (!emailRe.test(email)) return toast.error("Enter a valid email address.");
    setSaving(true);
    try {
      const { data } = await api.patch<User>("/auth/me", {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        avatar_url: avatar.trim() || null,
      });
      onUpdated(data);
      toast.success("Account updated.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Update your name, email, and profile picture.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block">Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block">Profile Picture URL</Label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Appearance ----------------------------- */
function AppearanceSection() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how Placera looks on this device.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-5 text-sm font-medium transition-colors",
              theme === value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------------------- Notifications ---------------------------- */
function NotificationsSection({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [prefs, setPrefs] = useState<NotificationSettings>(
    user.settings?.notifications ?? DEFAULT_NOTIFICATIONS,
  );
  const [saving, setSaving] = useState(false);

  const rows: { key: keyof NotificationSettings; label: string; desc: string }[] = [
    { key: "email", label: "Email notifications", desc: "Receive important updates by email." },
    { key: "application_updates", label: "Application updates", desc: "Stage changes on your applications." },
    { key: "interview_alerts", label: "Interview alerts", desc: "Reminders for scheduled interviews." },
  ];

  const setPref = (key: keyof NotificationSettings, value: boolean) =>
    setPrefs((p): NotificationSettings => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch<User>("/auth/settings", { notifications: prefs });
      onUpdated(data);
      toast.success("Notification preferences saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Control which alerts you receive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.desc}</p>
            </div>
            <Switch
              checked={prefs[row.key]}
              onCheckedChange={(v) => setPref(row.key, v)}
            />
          </div>
        ))}
        <div className="pt-3">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Privacy ------------------------------- */
function PrivacySection({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [privacy, setPrivacy] = useState<PrivacySettings>(user.settings?.privacy ?? DEFAULT_PRIVACY);
  const [saving, setSaving] = useState(false);

  const selectClass =
    "h-10 w-full rounded-lg border border-input bg-surface-2/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch<User>("/auth/settings", { privacy });
      onUpdated(data);
      toast.success("Privacy settings saved.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control who can see your profile and portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block">Profile visibility</Label>
          <select
            className={selectClass}
            value={privacy.profile_visibility}
            onChange={(e) =>
              setPrivacy((p) => ({
                ...p,
                profile_visibility: e.target.value as PrivacySettings["profile_visibility"],
              }))
            }
          >
            <option value="public">Public</option>
            <option value="recruiters">Recruiters only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block">Portfolio visibility</Label>
          <select
            className={selectClass}
            value={privacy.portfolio_visibility}
            onChange={(e) =>
              setPrivacy((p) => ({
                ...p,
                portfolio_visibility: e.target.value as PrivacySettings["portfolio_visibility"],
              }))
            }
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save privacy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Security ------------------------------- */
function SecuritySection({ onLogoutAll }: { onLogoutAll: () => Promise<void> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await api.get<{ items: SessionInfo[] }>("/auth/sessions")).data.items,
  });

  const changePassword = async () => {
    if (next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next))
      return toast.error("New password must contain letters and numbers.");
    if (next !== confirm) return toast.error("Passwords do not match.");
    setSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong password with letters and numbers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Current password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">New password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Confirm new password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={changePassword} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading sessions…</p>
          )}
          {sessionsQuery.data?.length ? (
            sessionsQuery.data.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.user_agent || "Unknown device"}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.ip || "—"} · since {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : sessionsQuery.isLoading ? null : (
            <p className="text-sm text-muted-foreground">No active sessions found.</p>
          )}
          <Button
            variant="danger"
            onClick={async () => {
              setLoggingOut(true);
              await onLogoutAll();
            }}
            disabled={loggingOut}
          >
            {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Logout all devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
