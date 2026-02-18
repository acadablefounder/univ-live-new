// src/pages/educator/WebsiteSettings.tsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Link2,
  Image as ImageIcon,
  Sparkles,
  Star,
  Users,
  Trophy,
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Palette,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Twitter,
  Send,
  MessageCircle,
} from "lucide-react";

import { useTenant } from "@/contexts/TenantProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

type StatItem = { label: string; value: string; icon?: string };
type AchievementItem = { title: string; description: string; icon?: string };
type FacultyItem = { name: string; subject?: string; designation?: string; experience?: string; bio?: string; image?: string };
type TestimonialItem = { name: string; course?: string; rating?: number; text: string; avatar?: string };

type SocialLinks = {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  telegram?: string;
  whatsapp?: string;
  website?: string;
};

type WebsiteConfig = {
  coachingName: string;
  tagline: string;
  heroImage?: string;
  themeId?: "theme1" | "theme2" | "theme3";
  socials?: SocialLinks;

  featuredTestIds?: string[];
  stats?: StatItem[];
  achievements?: AchievementItem[];
  faculty?: FacultyItem[];
  testimonials?: TestimonialItem[];
};

const ICONS = [
  { name: "Users", icon: Users },
  { name: "Star", icon: Star },
  { name: "Trophy", icon: Trophy },
  { name: "BookOpen", icon: BookOpen },
  { name: "Sparkles", icon: Sparkles },
];

function cleanSocials(s: Record<string, string>) {
  const out: Record<string, string> = {};
  Object.entries(s || {}).forEach(([k, v]) => {
    const vv = (v || "").trim();
    if (vv) out[k] = vv;
  });
  return out;
}

export default function WebsiteSettings() {
  const { tenant, loading } = useTenant();

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const educatorId = tenant?.educatorId;

  // website config state
  const [coachingName, setCoachingName] = useState("");
  const [tagline, setTagline] = useState("");
  const [heroImage, setHeroImage] = useState("");

  const [themeId, setThemeId] = useState<"theme1" | "theme2" | "theme3">("theme1");

  const [socials, setSocials] = useState<Record<string, string>>({
    instagram: "",
    youtube: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    telegram: "",
    whatsapp: "",
    website: "",
  });

  const [featuredTestIds, setFeaturedTestIds] = useState<string[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [faculty, setFaculty] = useState<FacultyItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // Load existing config
  useEffect(() => {
    if (!educatorId) return;

    async function loadConfig() {
      try {
        const ref = doc(db, "educators", educatorId);
        const snap = await getDoc(ref);

        const cfg = (snap.exists() ? (snap.data()?.websiteConfig as WebsiteConfig) : null) || null;

        setCoachingName(cfg?.coachingName || "");
        setTagline(cfg?.tagline || "");
        setHeroImage(cfg?.heroImage || "");

        setThemeId((cfg?.themeId as any) || "theme1");

        const s = (cfg?.socials || {}) as SocialLinks;
        setSocials({
          instagram: s.instagram || "",
          youtube: s.youtube || "",
          facebook: s.facebook || "",
          linkedin: s.linkedin || "",
          twitter: s.twitter || "",
          telegram: s.telegram || "",
          whatsapp: s.whatsapp || "",
          website: s.website || "",
        });

        setFeaturedTestIds(cfg?.featuredTestIds || []);
        setStats(cfg?.stats || []);
        setAchievements(cfg?.achievements || []);
        setFaculty(cfg?.faculty || []);
        setTestimonials(cfg?.testimonials || []);
      } catch {
        toast({
          title: "Failed to load",
          description: "Could not load website settings. Please refresh.",
          variant: "destructive",
        });
      }
    }

    loadConfig();
  }, [educatorId]);

  const websiteUrl = useMemo(() => {
    if (!tenant?.tenantSlug) return "";
    return `https://${tenant.tenantSlug}.univ.live`;
  }, [tenant?.tenantSlug]);

  async function saveAll() {
    if (!educatorId) return;

    if (!coachingName.trim()) {
      toast({
        title: "Missing coaching name",
        description: "Please set your Coaching/Institute name.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const cfg: WebsiteConfig = {
        coachingName: coachingName.trim(),
        tagline: tagline.trim(),
        heroImage: heroImage.trim() || "",
        themeId: themeId || "theme1",
        socials: cleanSocials(socials),

        featuredTestIds,
        stats,
        achievements,
        faculty,
        testimonials,
      };

      await setDoc(
        doc(db, "educators", educatorId),
        {
          websiteConfig: cfg,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "Saved",
        description: "Website settings updated successfully.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save website settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!tenant || !educatorId) {
    return (
      <div className="p-6 rounded-2xl border border-dashed text-muted-foreground">
        No tenant context found. Please login as educator.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Website Settings</h1>
          <p className="text-muted-foreground text-sm">
            Customize your coaching website landing page (theme changes only affect the home page).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {websiteUrl ? (
            <Button variant="outline" onClick={() => window.open(websiteUrl, "_blank")}>
              <Globe className="h-4 w-4 mr-2" />
              Open Website
            </Button>
          ) : null}

          <Button onClick={saveAll} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="achievements">Awards</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="testimonials">Reviews</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-6">
          {/* Theme Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Website Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Same data for all themes. Only the landing page design changes.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Theme 1 */}
                <button
                  type="button"
                  onClick={() => setThemeId("theme1")}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    themeId === "theme1"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">Theme 1</div>
                    {themeId === "theme1" ? <Badge>Selected</Badge> : <Badge variant="outline">Classic</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your current default theme (existing design).
                  </p>
                </button>

                {/* Theme 2 */}
                <button
                  type="button"
                  onClick={() => setThemeId("theme2")}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    themeId === "theme2"
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">Theme 2</div>
                    {themeId === "theme2" ? <Badge>Selected</Badge> : <Badge variant="outline">Elevate</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Modern Lovable-style landing layout (new).
                  </p>
                </button>

                {/* Theme 3 (Coming soon) */}
                <button
                  type="button"
                  disabled
                  className="text-left p-4 rounded-2xl border border-border opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">Theme 3</div>
                    <Badge variant="outline">Coming soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Will be added in the next phase.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Branding & Hero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coaching / Institute Name</Label>
                  <Input value={coachingName} onChange={(e) => setCoachingName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Hero Image URL
                </Label>
                <Input
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste an image URL. (Optional)
                </p>
              </div>

              {websiteUrl ? (
                <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/20">
                  <Link2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Your website URL</p>
                    <p className="text-xs text-muted-foreground break-all">{websiteUrl}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Tenant slug not found. Subdomain URL will show once it’s set.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                  <Input
                    value={socials.instagram}
                    onChange={(e) => setSocials((p) => ({ ...p, instagram: e.target.value }))}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube</Label>
                  <Input
                    value={socials.youtube}
                    onChange={(e) => setSocials((p) => ({ ...p, youtube: e.target.value }))}
                    placeholder="https://youtube.com/@..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                  <Input
                    value={socials.facebook}
                    onChange={(e) => setSocials((p) => ({ ...p, facebook: e.target.value }))}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                  <Input
                    value={socials.linkedin}
                    onChange={(e) => setSocials((p) => ({ ...p, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> X (Twitter)</Label>
                  <Input
                    value={socials.twitter}
                    onChange={(e) => setSocials((p) => ({ ...p, twitter: e.target.value }))}
                    placeholder="https://x.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Send className="h-4 w-4" /> Telegram</Label>
                  <Input
                    value={socials.telegram}
                    onChange={(e) => setSocials((p) => ({ ...p, telegram: e.target.value }))}
                    placeholder="https://t.me/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</Label>
                  <Input
                    value={socials.whatsapp}
                    onChange={(e) => setSocials((p) => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="https://wa.me/91XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
                  <Input
                    value={socials.website}
                    onChange={(e) => setSocials((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Leave any field blank if not used. These links will show on the landing page footer/header (theme-dependent).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURED */}
        <TabsContent value="featured" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Featured Test Series IDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste test series document IDs to feature them on the landing page.
                If empty, newest tests will be shown automatically.
              </p>

              <div className="space-y-3">
                {featuredTestIds.map((id, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={id}
                      onChange={(e) => {
                        const next = [...featuredTestIds];
                        next[idx] = e.target.value;
                        setFeaturedTestIds(next);
                      }}
                      placeholder="testDocId"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFeaturedTestIds((p) => p.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setFeaturedTestIds((p) => [...p, ""])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Test ID
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATS */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.map((s, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={s.label}
                      onChange={(e) => {
                        const next = [...stats];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setStats(next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={s.value}
                      onChange={(e) => {
                        const next = [...stats];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setStats(next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <select
                      className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                      value={s.icon || "Users"}
                      onChange={(e) => {
                        const next = [...stats];
                        next[idx] = { ...next[idx], icon: e.target.value };
                        setStats(next);
                      }}
                    >
                      {ICONS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStats((p) => p.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                    <Separator className="mt-4" />
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={() => setStats((p) => [...p, { label: "", value: "", icon: "Users" }])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stat
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACHIEVEMENTS */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Awards / Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((a, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="space-y-2 md:col-span-1">
                      <Label>Title</Label>
                      <Input
                        value={a.title}
                        onChange={(e) => {
                          const next = [...achievements];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setAchievements(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-1">
                      <Label>Icon</Label>
                      <select
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                        value={a.icon || "Trophy"}
                        onChange={(e) => {
                          const next = [...achievements];
                          next[idx] = { ...next[idx], icon: e.target.value };
                          setAchievements(next);
                        }}
                      >
                        {ICONS.map((i) => (
                          <option key={i.name} value={i.name}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-1 flex items-end">
                      <Button
                        variant="outline"
                        onClick={() => setAchievements((p) => p.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={a.description}
                      onChange={(e) => {
                        const next = [...achievements];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setAchievements(next);
                      }}
                    />
                  </div>

                  <Separator />
                </div>
              ))}

              <Button variant="outline" onClick={() => setAchievements((p) => [...p, { title: "", description: "", icon: "Trophy" }])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Achievement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FACULTY */}
        <TabsContent value="faculty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faculty</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faculty.map((f, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={f.name}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setFaculty(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={f.subject || ""}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], subject: e.target.value };
                          setFaculty(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input
                        value={f.designation || ""}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], designation: e.target.value };
                          setFaculty(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <Input
                        value={f.experience || ""}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], experience: e.target.value };
                          setFaculty(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Bio</Label>
                      <Textarea
                        value={f.bio || ""}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], bio: e.target.value };
                          setFaculty(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Image URL</Label>
                      <Input
                        value={f.image || ""}
                        onChange={(e) => {
                          const next = [...faculty];
                          next[idx] = { ...next[idx], image: e.target.value };
                          setFaculty(next);
                        }}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFaculty((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Faculty
                  </Button>

                  <Separator />
                </div>
              ))}

              <Button variant="outline" onClick={() => setFaculty((p) => [...p, { name: "" }])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTIMONIALS */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Testimonials / Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testimonials.map((t, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Student Name</Label>
                      <Input
                        value={t.name}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setTestimonials(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Course / Context</Label>
                      <Input
                        value={t.course || ""}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[idx] = { ...next[idx], course: e.target.value };
                          setTestimonials(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rating (1-5)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={t.rating || 5}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[idx] = { ...next[idx], rating: Number(e.target.value) };
                          setTestimonials(next);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Avatar URL</Label>
                      <Input
                        value={t.avatar || ""}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[idx] = { ...next[idx], avatar: e.target.value };
                          setTestimonials(next);
                        }}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Review Text</Label>
                      <Textarea
                        value={t.text}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[idx] = { ...next[idx], text: e.target.value };
                          setTestimonials(next);
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestimonials((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Review
                  </Button>

                  <Separator />
                </div>
              ))}

              <Button variant="outline" onClick={() => setTestimonials((p) => [...p, { name: "", text: "", rating: 5 }])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}

