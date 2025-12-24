import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Upload,
  Palette,
  Eye,
  Save,
  ExternalLink,
  Image,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthProvider"
import { db, storage } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type ThemeId = "theme1" | "theme2";

const themes: Array<{
  id: ThemeId;
  name: string;
  description: string;
  preview: string;
}> = [
  {
    id: "theme1",
    name: "Modern Minimal",
    description: "Clean and professional with focus on content",
    preview: "gradient-bg",
  },
  {
    id: "theme2",
    name: "Classic Academic",
    description: "Traditional educational institution feel",
    preview: "bg-blue-900",
  },
];

type WebsiteConfig = {
  coachingName: string;
  tagline: string;
  themeId: ThemeId;
  branding: {
    logoUrl: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
  };
  contact: {
    phone: string | null;
    email: string | null;
    city: string | null;
    address: string | null;
  };
  about: {
    description: string;
    achievements: Array<{ value: string; label: string }>;
  };
  socials: {
    facebook?: string | null;
    twitter?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    linkedin?: string | null;
    website?: string | null;
  };
  images?: {
    heroImages?: string[];
  };
};

const DEFAULT_CONFIG: WebsiteConfig = {
  coachingName: "",
  tagline: "",
  themeId: "theme1",
  branding: { logoUrl: null, primaryColor: "#6D28D9", accentColor: "#22C55E" },
  contact: { phone: null, email: null, city: null, address: null },
  about: {
    description: "",
    achievements: [
      { value: "500+", label: "Students Selected" },
      { value: "15+", label: "Years Experience" },
      { value: "50+", label: "Expert Faculty" },
    ],
  },
  socials: {
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    linkedin: null,
    website: null,
  },
  images: { heroImages: [] },
};

export default function WebsiteSettings() {
  const { profile } = useAuth();

  const educatorId = profile?.educatorId || "";
  const tenantSlug = profile?.tenantSlug || "";

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("theme1");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Meta
  const [websiteStatus, setWebsiteStatus] = useState<string>("NOT_CREATED");

  // Form state
  const [coachingName, setCoachingName] = useState("");
  const [tagline, setTagline] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [aboutDescription, setAboutDescription] = useState("");
  const [achievements, setAchievements] = useState<
    Array<{ value: string; label: string }>
  >(DEFAULT_CONFIG.about.achievements);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");

  const [heroImages, setHeroImages] = useState<string[]>([]);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const heroInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const siteUrl = useMemo(() => {
    if (!tenantSlug) return "";
    return `https://${tenantSlug}.univ.live`;
  }, [tenantSlug]);

  // Load educator meta + website config (live)
  useEffect(() => {
    if (!educatorId) return;

    setLoading(true);

    const unsubEducator = onSnapshot(
      doc(db, "educators", educatorId),
      (snap) => {
        const d = snap.data() as any;
        setWebsiteStatus(String(d?.websiteStatus || "NOT_CREATED"));
        // if coachingName not set in config yet, keep it in sync
        if (typeof d?.coachingName === "string" && !coachingName) {
          setCoachingName(d.coachingName);
        }
      }
    );

    const configRef = doc(db, "educators", educatorId, "websiteConfig", "default");
    const unsubConfig = onSnapshot(
      configRef,
      (snap) => {
        const d = (snap.exists() ? (snap.data() as any) : {}) as Partial<WebsiteConfig>;
        const merged: WebsiteConfig = {
          ...DEFAULT_CONFIG,
          ...d,
          branding: { ...DEFAULT_CONFIG.branding, ...(d.branding || {}) },
          contact: { ...DEFAULT_CONFIG.contact, ...(d.contact || {}) },
          about: {
            ...DEFAULT_CONFIG.about,
            ...(d.about || {}),
            achievements:
              (d.about?.achievements as any) ||
              DEFAULT_CONFIG.about.achievements,
          },
          socials: { ...DEFAULT_CONFIG.socials, ...(d.socials || {}) },
          images: {
            ...DEFAULT_CONFIG.images,
            ...(d.images || {}),
            heroImages: (d.images?.heroImages as any) || [],
          },
        };

        setSelectedTheme(merged.themeId);
        setCoachingName(merged.coachingName || "");
        setTagline(merged.tagline || "");

        setLogoUrl(merged.branding.logoUrl || null);

        setAboutDescription(merged.about.description || "");
        setAchievements(
          Array.isArray(merged.about.achievements) && merged.about.achievements.length
            ? merged.about.achievements.slice(0, 3)
            : DEFAULT_CONFIG.about.achievements
        );

        setPhone(String(merged.contact.phone || ""));
        setEmail(String(merged.contact.email || ""));
        setAddress(String(merged.contact.address || ""));

        setFacebook(String(merged.socials.facebook || ""));
        setTwitter(String(merged.socials.twitter || ""));
        setInstagram(String(merged.socials.instagram || ""));
        setYoutube(String(merged.socials.youtube || ""));
        setLinkedin(String(merged.socials.linkedin || ""));
        setWebsite(String(merged.socials.website || ""));

        setHeroImages(Array.isArray(merged.images?.heroImages) ? merged.images!.heroImages! : []);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubEducator();
      unsubConfig();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educatorId]);

  const uploadToStorage = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const onPickLogo = async (file: File) => {
    if (!educatorId) return;
    try {
      const url = await uploadToStorage(
        file,
        `educators/${educatorId}/branding/logo-${Date.now()}-${file.name}`
      );
      setLogoUrl(url);
      toast({
        title: "Logo uploaded",
        description: "Don’t forget to click Save Changes.",
      });
    } catch (e: any) {
      toast({ title: "Logo upload failed", description: e?.message || "Try again." });
    }
  };

  const onPickHero = async (slotIndex: number, file: File) => {
    if (!educatorId) return;
    try {
      const url = await uploadToStorage(
        file,
        `educators/${educatorId}/images/hero-${slotIndex + 1}-${Date.now()}-${file.name}`
      );
      setHeroImages((prev) => {
        const next = [...prev];
        // ensure array length
        while (next.length < 3) next.push("");
        next[slotIndex] = url;
        return next.filter((x) => x !== "");
      });
      toast({
        title: "Hero image uploaded",
        description: "Don’t forget to click Save Changes.",
      });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again." });
    }
  };

  const handleSave = async () => {
    if (!educatorId) return;

    setIsSaving(true);
    try {
      const configRef = doc(db, "educators", educatorId, "websiteConfig", "default");

      const payload: Partial<WebsiteConfig> = {
        coachingName: coachingName.trim(),
        tagline: tagline.trim(),
        themeId: selectedTheme,
        branding: {
          logoUrl: logoUrl || null,
          primaryColor: DEFAULT_CONFIG.branding.primaryColor,
          accentColor: DEFAULT_CONFIG.branding.accentColor,
        },
        contact: {
          phone: phone.trim() || null,
          email: email.trim() || null,
          city: null,
          address: address.trim() || null,
        },
        about: {
          description: aboutDescription.trim(),
          achievements: achievements.map((a) => ({
            value: String(a.value || "").trim(),
            label: String(a.label || "").trim(),
          })),
        },
        socials: {
          facebook: facebook.trim() || null,
          twitter: twitter.trim() || null,
          instagram: instagram.trim() || null,
          youtube: youtube.trim() || null,
          linkedin: linkedin.trim() || null,
          website: website.trim() || null,
        },
        images: {
          heroImages: heroImages.filter(Boolean).slice(0, 3),
        },
        // @ts-ignore
        updatedAt: serverTimestamp(),
      };

      // config doc (merge safe)
      await setDoc(configRef, payload as any, { merge: true });

      // Keep tenants mapping in sync (for subdomain resolution + theme)
      if (tenantSlug) {
        await setDoc(
          doc(db, "tenants", tenantSlug),
          {
            tenantSlug,
            educatorId,
            coachingName: coachingName.trim() || null,
            themeId: selectedTheme,
            // status stays whatever you use later
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      toast({
        title: "Settings saved!",
        description: "Your website has been updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadge = useMemo(() => {
    const s = String(websiteStatus || "").toUpperCase();
    const isActive = s === "ACTIVE" || s === "LIVE" || s === "COMPLETED";
    return (
      <Badge className={cn(isActive ? "bg-white/20 text-white" : "bg-white/20 text-white")}>
        {isActive ? "Active" : "Not Created"}
      </Badge>
    );
  }, [websiteStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Website Settings</h1>
          <p className="text-muted-foreground text-sm">
            Customize your public coaching website
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!siteUrl) {
                toast({ title: "No subdomain yet", description: "Tenant slug not found." });
                return;
              }
              window.open(siteUrl, "_blank", "noreferrer");
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            className="gradient-bg text-white"
            onClick={handleSave}
            disabled={isSaving || loading}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Subdomain Preview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <div className="gradient-bg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs">Your website URL</p>
                  <p className="text-white font-semibold">
                    {tenantSlug ? `${tenantSlug}.univ.live` : "your-coaching.univ.live"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {statusBadge}
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 text-white border-0 hover:bg-white/30"
                  onClick={() => {
                    if (!siteUrl) {
                      toast({ title: "No subdomain yet", description: "Tenant slug not found." });
                      return;
                    }
                    window.open(siteUrl, "_blank", "noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Site
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Want a custom domain? Upgrade to Growth plan to use{" "}
              <span className="font-medium">yourcoaching.com</span>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coaching Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coaching Name</Label>
                  <Input
                    value={coachingName}
                    onChange={(e) => setCoachingName(e.target.value)}
                    placeholder="Your coaching name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="A short tagline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Courses Offered</Label>
                <div className="flex flex-wrap gap-2">
                  {["CUET", "Mock Tests", "Sectionals", "PYQs"].map((course) => (
                    <Badge key={course} variant="secondary" className="px-3 py-1">
                      {course}
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Coming soon",
                        description: "Course editing will be wired next.",
                      })
                    }
                  >
                    + Add Course
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      (coachingName || "UL")
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                    )}
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickLogo(f);
                      e.currentTarget.value = "";
                    }}
                  />

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About Your Coaching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>About Description</Label>
                <Textarea
                  rows={6}
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="Tell students about your coaching, experience, and achievements..."
                />
              </div>

              <div className="space-y-2">
                <Label>Achievements</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {achievements.slice(0, 3).map((a, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border">
                      <Input
                        className="text-2xl font-bold border-0 p-0 h-auto focus-visible:ring-0"
                        value={a.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAchievements((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], value: v };
                            return next;
                          });
                        }}
                      />
                      <Input
                        className="text-sm text-muted-foreground border-0 p-0 h-auto focus-visible:ring-0"
                        value={a.label}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAchievements((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], label: v };
                            return next;
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcoaching.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full coaching address"
                />
              </div>

              <div className="space-y-2">
                <Label>Social Links</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <Input
                      placeholder="Facebook URL"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-sky-500" />
                    <Input
                      placeholder="Twitter URL"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <Input
                      placeholder="Instagram URL"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-600" />
                    <Input
                      placeholder="YouTube URL"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <Input
                      placeholder="LinkedIn URL"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Website URL"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Choose Your Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((theme) => (
                  <motion.div
                    key={theme.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "rounded-xl border-2 cursor-pointer overflow-hidden transition-colors",
                      selectedTheme === theme.id
                        ? "border-primary"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className={cn("h-32", theme.preview)} />
                    <div className="p-4 bg-card">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{theme.name}</h4>
                        {selectedTheme === theme.id && (
                          <Badge className="gradient-bg text-white">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {theme.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-5 w-5" />
                Hero Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative">
                    <input
                      ref={(el) => (heroInputRefs.current[idx] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickHero(idx, f);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div
                      onClick={() => heroInputRefs.current[idx]?.click()}
                      className={cn(
                        "aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30 overflow-hidden"
                      )}
                    >
                      {heroImages[idx] ? (
                        <img
                          src={heroImages[idx]}
                          alt={`Hero ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Hero Image {idx + 1}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended size: 1920x1080px. Maximum file size: 5MB.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Website Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                <div className="gradient-bg p-8">
                  <div className="max-w-lg">
                    <Badge className="bg-white/20 text-white mb-4">
                      #{tenantSlug ? "Your Coaching" : "1"} on UNIV.LIVE
                    </Badge>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {coachingName || "Your Coaching Name"}
                    </h2>
                    <p className="text-white/80 text-sm mb-4">
                      {tagline || "Your tagline will appear here"}
                    </p>
                    <Button className="bg-white text-foreground hover:bg-white/90">
                      Enroll Now
                    </Button>
                  </div>
                </div>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Live preview of your website hero section
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

