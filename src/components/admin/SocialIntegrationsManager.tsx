import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Instagram, Youtube, Plus, X, Save, Loader2, ExternalLink, Facebook, Settings } from "lucide-react";
import { SocialIcon, TikTokIcon, PinterestIcon } from "@/components/SocialIcons";

interface PlatformConfig {
  username?: string;
  access_token?: string;
  page_url?: string;
  page_id?: string;
  channel_url?: string;
  featured_video_id?: string;
  video_ids?: string[];
  video_urls?: string[];
  profile_url?: string;
  boards?: string[];
  posts?: Array<{
    id: string;
    image_url: string;
    permalink: string;
    caption?: string;
  }>;
  // Visibility toggles
  show_in_header?: boolean;
  show_in_footer?: boolean;
  show_in_sticky_bar?: boolean;
}

interface SocialSetting {
  id: string;
  platform: string;
  is_enabled: boolean;
  config: PlatformConfig;
}

interface SiteSettingRaw {
  key: string;
  value: { enabled?: boolean };
}

const PLATFORMS = [
  { id: "instagram", label: "אינסטגרם", icon: Instagram, color: "text-pink-500" },
  { id: "youtube", label: "יוטיוב", icon: Youtube, color: "text-red-500" },
  { id: "facebook", label: "פייסבוק", icon: Facebook, color: "text-blue-600" },
  { id: "tiktok", label: "TikTok", icon: TikTokIcon, color: "text-foreground" },
  { id: "pinterest", label: "Pinterest", icon: PinterestIcon, color: "text-red-600" },
];

const SocialIntegrationsManager = () => {
  const queryClient = useQueryClient();
  
  // Platform configs state
  const [configs, setConfigs] = useState<Record<string, { enabled: boolean; config: PlatformConfig }>>({});
  
  // Sticky bar master toggle
  const [stickyBarEnabled, setStickyBarEnabled] = useState(true);
  
  // Temp states for adding items
  const [newVideoId, setNewVideoId] = useState("");
  const [newInstagramPost, setNewInstagramPost] = useState({ image_url: "", permalink: "", caption: "" });
  const [newTiktokVideo, setNewTiktokVideo] = useState("");
  const [newBoard, setNewBoard] = useState("");

  // Fetch social settings
  const { data: socialSettings, isLoading } = useQuery({
    queryKey: ["social-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_settings")
        .select("*");
      if (error) throw error;
      return data as unknown as SocialSetting[];
    }
  });

  // Fetch sticky bar setting
  const { data: stickyBarSetting } = useQuery({
    queryKey: ["sticky-bar-setting"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "sticky_social_bar")
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettingRaw | null;
    }
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (socialSettings) {
      const newConfigs: Record<string, { enabled: boolean; config: PlatformConfig }> = {};
      socialSettings.forEach(setting => {
        newConfigs[setting.platform] = {
          enabled: setting.is_enabled,
          config: {
            ...setting.config,
            show_in_header: setting.config.show_in_header ?? true,
            show_in_footer: setting.config.show_in_footer ?? true,
            show_in_sticky_bar: setting.config.show_in_sticky_bar ?? true,
          }
        };
      });
      setConfigs(newConfigs);
    }
  }, [socialSettings]);

  useEffect(() => {
    if (stickyBarSetting) {
      setStickyBarEnabled(stickyBarSetting.value?.enabled ?? true);
    }
  }, [stickyBarSetting]);

  // Save mutation for individual platform
  const saveMutation = useMutation({
    mutationFn: async ({ platform, is_enabled, config }: { platform: string; is_enabled: boolean; config: PlatformConfig }) => {
      const { data: existing } = await supabase
        .from("social_settings")
        .select("id")
        .eq("platform", platform)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from("social_settings")
          .update({ is_enabled, config: JSON.parse(JSON.stringify(config)), updated_at: new Date().toISOString() })
          .eq("platform", platform);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_settings")
          .insert({ platform, is_enabled, config: JSON.parse(JSON.stringify(config)) });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-settings"] });
      queryClient.invalidateQueries({ queryKey: ["social-settings-global"] });
      toast.success("ההגדרות נשמרו בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בשמירת ההגדרות");
    }
  });

  // Save sticky bar setting
  const saveStickyBarMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "sticky_social_bar")
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value: { enabled }, updated_at: new Date().toISOString() })
          .eq("key", "sticky_social_bar");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key: "sticky_social_bar", value: { enabled } });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sticky-bar-setting"] });
      toast.success("הגדרות בר צף נשמרו");
    },
    onError: () => {
      toast.error("שגיאה בשמירת הגדרות בר צף");
    }
  });

  const updateConfig = (platform: string, updates: Partial<PlatformConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        config: { ...prev[platform]?.config, ...updates }
      }
    }));
  };

  const updateEnabled = (platform: string, enabled: boolean) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: { ...prev[platform], enabled }
    }));
  };

  const savePlatform = (platform: string) => {
    const data = configs[platform];
    if (data) {
      saveMutation.mutate({ platform, is_enabled: data.enabled, config: data.config });
    }
  };

  // Helper functions for managing arrays
  const addVideoId = () => {
    if (newVideoId.trim()) {
      let videoId = newVideoId.trim();
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = newVideoId.match(youtubeRegex);
      if (match) videoId = match[1];
      
      const current = configs.youtube?.config?.video_ids || [];
      updateConfig("youtube", { video_ids: [...current, videoId] });
      setNewVideoId("");
    }
  };

  const removeVideoId = (index: number) => {
    const current = configs.youtube?.config?.video_ids || [];
    updateConfig("youtube", { video_ids: current.filter((_, i) => i !== index) });
  };

  const addInstagramPost = () => {
    if (newInstagramPost.image_url.trim() && newInstagramPost.permalink.trim()) {
      const current = configs.instagram?.config?.posts || [];
      updateConfig("instagram", { 
        posts: [...current, { ...newInstagramPost, id: Date.now().toString() }] 
      });
      setNewInstagramPost({ image_url: "", permalink: "", caption: "" });
    }
  };

  const removeInstagramPost = (index: number) => {
    const current = configs.instagram?.config?.posts || [];
    updateConfig("instagram", { posts: current.filter((_, i) => i !== index) });
  };

  const addTiktokVideo = () => {
    if (newTiktokVideo.trim()) {
      const current = configs.tiktok?.config?.video_urls || [];
      updateConfig("tiktok", { video_urls: [...current, newTiktokVideo.trim()] });
      setNewTiktokVideo("");
    }
  };

  const removeTiktokVideo = (index: number) => {
    const current = configs.tiktok?.config?.video_urls || [];
    updateConfig("tiktok", { video_urls: current.filter((_, i) => i !== index) });
  };

  const addBoard = () => {
    if (newBoard.trim()) {
      const current = configs.pinterest?.config?.boards || [];
      updateConfig("pinterest", { boards: [...current, newBoard.trim()] });
      setNewBoard("");
    }
  };

  const removeBoard = (index: number) => {
    const current = configs.pinterest?.config?.boards || [];
    updateConfig("pinterest", { boards: current.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderVisibilityToggles = (platform: string) => (
    <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Switch
          checked={configs[platform]?.config?.show_in_header ?? true}
          onCheckedChange={(checked) => updateConfig(platform, { show_in_header: checked })}
        />
        <Label className="text-sm">הצג בהאדר</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={configs[platform]?.config?.show_in_footer ?? true}
          onCheckedChange={(checked) => updateConfig(platform, { show_in_footer: checked })}
        />
        <Label className="text-sm">הצג בפוטר</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={configs[platform]?.config?.show_in_sticky_bar ?? true}
          onCheckedChange={(checked) => updateConfig(platform, { show_in_sticky_bar: checked })}
        />
        <Label className="text-sm">הצג בבר צף</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Master Sticky Bar Toggle */}
      <Card className="border-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">הגדרות גלובליות</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <Label className="text-base font-medium">בר רשתות חברתיות צף</Label>
              <p className="text-sm text-muted-foreground">בר אנכי צף בצד המסך עם קישורים לרשתות החברתיות</p>
            </div>
            <Switch
              checked={stickyBarEnabled}
              onCheckedChange={(checked) => {
                setStickyBarEnabled(checked);
                saveStickyBarMutation.mutate(checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Tabs */}
      <Tabs defaultValue="instagram" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {PLATFORMS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="flex items-center gap-2">
              {typeof Icon === 'function' && Icon.length === 1 ? (
                <Icon className="h-4 w-4" />
              ) : (
                <SocialIcon platform={id} className="h-4 w-4" />
              )}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Instagram Tab */}
        <TabsContent value="instagram">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    הגדרות אינסטגרם
                  </CardTitle>
                  <CardDescription>הגדר את חשבון האינסטגרם והפוסטים להצגה</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">פעיל</Label>
                  <Switch
                    checked={configs.instagram?.enabled ?? false}
                    onCheckedChange={(checked) => updateEnabled("instagram", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>שם משתמש</Label>
                  <Input
                    value={configs.instagram?.config?.username || ""}
                    onChange={(e) => updateConfig("instagram", { username: e.target.value })}
                    placeholder="@diamony_jewelry"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token (אופציונלי)</Label>
                  <Input
                    value={configs.instagram?.config?.access_token || ""}
                    onChange={(e) => updateConfig("instagram", { access_token: e.target.value })}
                    placeholder="לחיבור API"
                    type="password"
                    dir="ltr"
                  />
                </div>
              </div>

              {renderVisibilityToggles("instagram")}

              {/* Posts */}
              <div className="space-y-4">
                <Label className="text-base font-medium">פוסטים להצגה</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                  <Input
                    value={newInstagramPost.image_url}
                    onChange={(e) => setNewInstagramPost(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="כתובת תמונה"
                    dir="ltr"
                  />
                  <Input
                    value={newInstagramPost.permalink}
                    onChange={(e) => setNewInstagramPost(prev => ({ ...prev, permalink: e.target.value }))}
                    placeholder="קישור לפוסט"
                    dir="ltr"
                  />
                  <Button onClick={addInstagramPost} variant="outline">
                    <Plus className="h-4 w-4 ml-2" />הוסף
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(configs.instagram?.config?.posts || []).map((post, index) => (
                    <div key={post.id} className="relative group aspect-square rounded-md overflow-hidden border">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-full">
                          <ExternalLink className="h-4 w-4 text-gray-800" />
                        </a>
                        <button onClick={() => removeInstagramPost(index)} className="p-1.5 bg-red-500 rounded-full">
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => savePlatform("instagram")} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube Tab */}
        <TabsContent value="youtube">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                    הגדרות יוטיוב
                  </CardTitle>
                  <CardDescription>הגדר את ערוץ היוטיוב והסרטונים להצגה</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">פעיל</Label>
                  <Switch
                    checked={configs.youtube?.enabled ?? false}
                    onCheckedChange={(checked) => updateEnabled("youtube", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>כתובת ערוץ</Label>
                  <Input
                    value={configs.youtube?.config?.channel_url || ""}
                    onChange={(e) => updateConfig("youtube", { channel_url: e.target.value })}
                    placeholder="https://youtube.com/@diamony"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>סרטון מוביל (Video ID)</Label>
                  <Input
                    value={configs.youtube?.config?.featured_video_id || ""}
                    onChange={(e) => updateConfig("youtube", { featured_video_id: e.target.value })}
                    placeholder="dQw4w9WgXcQ"
                    dir="ltr"
                  />
                </div>
              </div>

              {renderVisibilityToggles("youtube")}

              {/* Videos */}
              <div className="space-y-4">
                <Label className="text-base font-medium">סרטונים נוספים</Label>
                <div className="flex gap-2">
                  <Input
                    value={newVideoId}
                    onChange={(e) => setNewVideoId(e.target.value)}
                    placeholder="Video ID או קישור"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button onClick={addVideoId} variant="outline">
                    <Plus className="h-4 w-4 ml-2" />הוסף
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(configs.youtube?.config?.video_ids || []).map((videoId, index) => (
                    <div key={index} className="relative group aspect-video rounded-md overflow-hidden border bg-muted">
                      <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white rounded-full">
                          <ExternalLink className="h-4 w-4 text-gray-800" />
                        </a>
                        <button onClick={() => removeVideoId(index)} className="p-1.5 bg-red-500 rounded-full">
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => savePlatform("youtube")} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facebook Tab */}
        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    הגדרות פייסבוק
                  </CardTitle>
                  <CardDescription>הגדר את דף הפייסבוק העסקי</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">פעיל</Label>
                  <Switch
                    checked={configs.facebook?.enabled ?? false}
                    onCheckedChange={(checked) => updateEnabled("facebook", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>כתובת דף פייסבוק</Label>
                  <Input
                    value={configs.facebook?.config?.page_url || ""}
                    onChange={(e) => updateConfig("facebook", { page_url: e.target.value })}
                    placeholder="https://facebook.com/diamony"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Page ID (לשילוב עתידי)</Label>
                  <Input
                    value={configs.facebook?.config?.page_id || ""}
                    onChange={(e) => updateConfig("facebook", { page_id: e.target.value })}
                    placeholder="123456789"
                    dir="ltr"
                  />
                </div>
              </div>

              {renderVisibilityToggles("facebook")}

              <Button onClick={() => savePlatform("facebook")} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TikTok Tab */}
        <TabsContent value="tiktok">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TikTokIcon className="h-5 w-5" />
                    הגדרות TikTok
                  </CardTitle>
                  <CardDescription>הגדר את חשבון הטיקטוק</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">פעיל</Label>
                  <Switch
                    checked={configs.tiktok?.enabled ?? false}
                    onCheckedChange={(checked) => updateEnabled("tiktok", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>שם משתמש</Label>
                <Input
                  value={configs.tiktok?.config?.username || ""}
                  onChange={(e) => updateConfig("tiktok", { username: e.target.value })}
                  placeholder="@diamony_jewelry"
                  dir="ltr"
                />
              </div>

              {renderVisibilityToggles("tiktok")}

              {/* Videos */}
              <div className="space-y-4">
                <Label className="text-base font-medium">קישורים לסרטונים</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTiktokVideo}
                    onChange={(e) => setNewTiktokVideo(e.target.value)}
                    placeholder="https://tiktok.com/@username/video/..."
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button onClick={addTiktokVideo} variant="outline">
                    <Plus className="h-4 w-4 ml-2" />הוסף
                  </Button>
                </div>
                <div className="space-y-2">
                  {(configs.tiktok?.config?.video_urls || []).map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                      <span className="flex-1 text-sm truncate" dir="ltr">{url}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button onClick={() => removeTiktokVideo(index)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => savePlatform("tiktok")} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pinterest Tab */}
        <TabsContent value="pinterest">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PinterestIcon className="h-5 w-5 text-red-600" />
                    הגדרות Pinterest
                  </CardTitle>
                  <CardDescription>הגדר את חשבון הפינטרסט</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">פעיל</Label>
                  <Switch
                    checked={configs.pinterest?.enabled ?? false}
                    onCheckedChange={(checked) => updateEnabled("pinterest", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>כתובת פרופיל</Label>
                <Input
                  value={configs.pinterest?.config?.profile_url || ""}
                  onChange={(e) => updateConfig("pinterest", { profile_url: e.target.value })}
                  placeholder="https://pinterest.com/diamony"
                  dir="ltr"
                />
              </div>

              {renderVisibilityToggles("pinterest")}

              {/* Boards */}
              <div className="space-y-4">
                <Label className="text-base font-medium">לוחות (Boards)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBoard}
                    onChange={(e) => setNewBoard(e.target.value)}
                    placeholder="https://pinterest.com/diamony/rings"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button onClick={addBoard} variant="outline">
                    <Plus className="h-4 w-4 ml-2" />הוסף
                  </Button>
                </div>
                <div className="space-y-2">
                  {(configs.pinterest?.config?.boards || []).map((board, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                      <span className="flex-1 text-sm truncate" dir="ltr">{board}</span>
                      <a href={board} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                      <button onClick={() => removeBoard(index)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => savePlatform("pinterest")} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialIntegrationsManager;