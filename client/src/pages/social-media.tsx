import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fetchEvents, type TournamentEvent } from "@/lib/supabase";
import {
  Calendar,
  Facebook,
  Instagram,
  Twitter,
  Plus,
  Image as ImageIcon,
  Clock,
  Send,
  Sparkles,
  Hash,
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor: string;
  publishedAt?: string;
  engagement?: { likes: number; comments: number; shares: number };
  tournamentName?: string;
}

const mockSocialPosts: SocialPost[] = [
  { id: "sp1", content: "REGISTRATION IS OPEN! The Northeast Summer Classic is back in Harrisburg, PA — July 18-20. 5 age divisions, top competition, great facilities. Secure your spot now! [link] #YouthBaseball #Player1 #NortheastSummerClassic", platforms: ["facebook", "instagram", "twitter"], status: "published", scheduledFor: "2026-06-20T09:00", publishedAt: "2026-06-20T09:01", engagement: { likes: 142, comments: 23, shares: 18 }, tournamentName: "Northeast Summer Classic" },
  { id: "sp2", content: "Only 8 spots left in 14U! Don't miss out on the Northeast Summer Classic. Register now before it's too late! [link] #Baseball #14U #Harrisburg", platforms: ["facebook", "instagram"], status: "scheduled", scheduledFor: "2026-06-30T14:00", tournamentName: "Northeast Summer Classic" },
  { id: "sp3", content: "Fastpitch families! The Garden State Showcase is filling up fast. 10U through 18U divisions available in Somerville, NJ. Early-bird ends July 1! [link] #Fastpitch #Softball #GardenStateShowcase", platforms: ["facebook", "instagram", "twitter"], status: "published", scheduledFor: "2026-06-22T10:00", publishedAt: "2026-06-22T10:02", engagement: { likes: 89, comments: 12, shares: 31 }, tournamentName: "Garden State Fastpitch Showcase" },
  { id: "sp4", content: "Behind the scenes at the Northeast Summer Classic! Great energy, great teams, great baseball. Who's ready for next year? [photo] #BaseballLife #TournamentDay", platforms: ["instagram"], status: "draft", scheduledFor: "", tournamentName: "Northeast Summer Classic" },
  { id: "sp5", content: "Results are in! Congratulations to all our champions at the Garden State Fastpitch Showcase. Full bracket results at [link]. See you next year! #Fastpitch #Champions #GardenState", platforms: ["facebook", "twitter"], status: "scheduled", scheduledFor: "2026-07-28T16:00", tournamentName: "Garden State Fastpitch Showcase" },
];

const platformConfig: Record<string, { icon: any; label: string; color: string; charLimit: number }> = {
  facebook: { icon: Facebook, label: "Facebook", color: "text-blue-500", charLimit: 5000 },
  instagram: { icon: Instagram, label: "Instagram", color: "text-purple-500", charLimit: 2200 },
  twitter: { icon: Twitter, label: "X / Twitter", color: "text-slate-400", charLimit: 280 },
};

const connectedPlatforms = [
  { name: "facebook", account: "Player1 Tournaments", status: "connected" },
  { name: "instagram", account: "@player1tournaments", status: "connected" },
  { name: "twitter", account: "@Player1Tourny", status: "disconnected" },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: Clock },
  scheduled: { color: "bg-blue-500/15 text-blue-500", icon: Clock },
  published: { color: "bg-emerald-500/15 text-emerald-500", icon: CheckCircle2 },
  failed: { color: "bg-red-500/15 text-red-500", icon: AlertCircle },
};

export default function SocialMedia() {
  const [posts] = useState<SocialPost[]>(mockSocialPosts);
  const [composeContent, setComposeContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [generated, setGenerated] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentEvent[]>([]);

  useEffect(() => {
    fetchEvents().then(setTournaments).catch(() => {});
  }, []);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = () => {
    setComposeContent(
      `BASEBALL SEASON IS HERE! ${selectedTournament ? selectedTournament : "Northeast Summer Classic"} registration is OPEN! Top competition, great facilities, and an unforgettable experience. Secure your team's spot today! [link] #YouthBaseball #Player1 #TournamentBaseball`
    );
    setGenerated(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Social Media Manager</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create, schedule, and publish across all your social platforms</p>
        </div>
        <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-new-post">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Post
        </Button>
      </div>

      {/* Connected Accounts */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {connectedPlatforms.map((p) => {
              const config = platformConfig[p.name];
              const Icon = config.icon;
              return (
                <div key={p.name} className={cn("flex items-center gap-3 rounded-lg border p-3", p.status === "connected" ? "border-card-border" : "border-card-border border-dashed opacity-60")}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">{config.label}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{p.account}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[9px]", p.status === "connected" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")}>
                    {p.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="calendar" className="text-xs">Content Calendar</TabsTrigger>
          <TabsTrigger value="composer" className="text-xs">Post Composer</TabsTrigger>
        </TabsList>

        {/* Content Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Send className="h-3.5 w-3.5" /> Published</div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{posts.filter(p => p.status === "published").length}</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Scheduled</div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-blue-500" style={{ fontFamily: "var(--font-display)" }}>{posts.filter(p => p.status === "scheduled").length}</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Heart className="h-3.5 w-3.5" /> Total Likes</div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{posts.reduce((s, p) => s + (p.engagement?.likes || 0), 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Share2 className="h-3.5 w-3.5" /> Total Shares</div>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{posts.reduce((s, p) => s + (p.engagement?.shares || 0), 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Posts List */}
          <div className="space-y-3">
            {posts.map((post) => {
              const StatusIcon = statusConfig[post.status].icon;
              return (
                <Card key={post.id} className="border-card-border" data-testid={`card-social-post-${post.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Platforms */}
                      <div className="flex flex-col gap-1.5 pt-0.5">
                        {post.platforms.map((p) => {
                          const config = platformConfig[p];
                          const Icon = config?.icon;
                          return Icon ? <Icon key={p} className={cn("h-3.5 w-3.5", config.color)} /> : null;
                        })}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[9px]", statusConfig[post.status].color)}>
                            <StatusIcon className="mr-1 h-2.5 w-2.5" /> {post.status}
                          </Badge>
                          {post.tournamentName && (
                            <span className="text-[10px] text-muted-foreground">{post.tournamentName}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-foreground line-clamp-2">{post.content}</p>

                        {/* Engagement or Schedule */}
                        <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                          {post.status === "published" && post.engagement ? (
                            <>
                              <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.engagement.likes}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.engagement.comments}</span>
                              <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {post.engagement.shares}</span>
                              <span className="text-muted-foreground/60">· Published {post.publishedAt?.split("T")[0]}</span>
                            </>
                          ) : post.status === "scheduled" ? (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled for {post.scheduledFor.split("T")[0]} at {post.scheduledFor.split("T")[1]}</span>
                          ) : (
                            <span>Draft</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`button-edit-post-${post.id}`}>
                          <ImageIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Post Composer */}
        <TabsContent value="composer" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Composer */}
            <div className="space-y-4 lg:col-span-2">
              {/* Platform Selection */}
              <Card className="border-card-border">
                <CardContent className="p-4">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Platforms</Label>
                  <div className="mt-2 flex gap-2">
                    {Object.entries(platformConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = selectedPlatforms.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => togglePlatform(key)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            isSelected ? "border-primary bg-primary/5 text-primary" : "border-card-border text-muted-foreground"
                          )}
                          data-testid={`button-platform-${key}`}
                        >
                          <Icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="border-card-border">
                <CardContent className="space-y-3 p-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tournament</Label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground"
                      data-testid="select-social-tournament"
                    >
                      <option value="">Select tournament...</option>
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Post Content</Label>
                      <span className="text-[10px] text-muted-foreground">{composeContent.length} chars</span>
                    </div>
                    <Textarea
                      value={composeContent}
                      onChange={(e) => setComposeContent(e.target.value)}
                      placeholder="Write your social media post or generate one with AI..."
                      rows={5}
                      className="mt-1 text-xs"
                      data-testid="input-social-content"
                    />
                  </div>

                  {/* AI Generate */}
                  <Button
                    onClick={handleGenerate}
                    variant="outline"
                    className="w-full border-primary/30 text-primary"
                    data-testid="button-generate-social"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Generate with AI
                  </Button>

                  {/* Media */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs" data-testid="button-add-image">
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Add Image
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" data-testid="button-add-video">
                      <Video className="mr-1.5 h-3.5 w-3.5" /> Add Video
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" data-testid="button-add-hashtag">
                      <Hash className="mr-1.5 h-3.5 w-3.5" /> Hashtags
                    </Button>
                  </div>

                  {/* Schedule */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" data-testid="button-save-draft-social">
                      Save Draft
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" data-testid="button-schedule-social">
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Schedule
                    </Button>
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-xs" data-testid="button-publish-now">
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Publish Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Preview</h3>
              {selectedPlatforms.map((platform) => {
                const config = platformConfig[platform];
                const Icon = config?.icon;
                return (
                  <Card key={platform} className="border-card-border" data-testid={`card-preview-${platform}`}>
                    <CardContent className="p-4">
                      {/* Platform Header */}
                      <div className="flex items-center gap-2 border-b border-card-border pb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Player1 Tournaments</p>
                          <p className="text-[10px] text-muted-foreground">{config.label}</p>
                        </div>
                      </div>
                      {/* Post Content */}
                      <p className="mt-3 text-xs text-foreground whitespace-pre-wrap">
                        {composeContent || "Your post content will appear here..."}
                      </p>
                      {/* Engagement Bar */}
                      <div className="mt-3 flex items-center gap-4 border-t border-card-border pt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> Like</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
                        <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
