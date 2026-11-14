import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./lib/supabase";

type Video = {
  id: string;
  title: string;
  category: string;
  owner_id: string;
  storage_path: string;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
};

type VideoComment = {
  id: string;
  video_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

type Playlist = {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  owner_id?: string;
};

type PlaylistVideo = {
  playlist_id: string;
  video_id: string;
  position: number;
  added_at: string;
};

const languages = [
  "Urdu", "Hindi", "English", "Arabic", "Spanish", "French",
  "German", "Turkish", "Chinese", "Japanese", "Portuguese",
  "Russian", "Bengali", "Punjabi"
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const STORAGE_BUCKET = "Videos";
const PROFILE_BUCKET = "profile-images";

function App() {
  const [page, setPage] = useState("home");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadCategory, setUploadCategory] = useState("Entertainment");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const [databaseStatus, setDatabaseStatus] = useState("Checking database connection...");
  const [authMode, setAuthMode] = useState("login");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [settingsVideo, setSettingsVideo] = useState<string | null>(null);
  const [audioMode, setAudioMode] = useState("Original Audio");
  const [dubLanguage, setDubLanguage] = useState("Urdu");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: "",
    display_name: "",
    bio: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [profileVideos, setProfileVideos] = useState<Video[]>([]);
  const [profileVideoUrls, setProfileVideoUrls] = useState<Record<string, string>>({});
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [commentsByVideo, setCommentsByVideo] = useState<Record<string, VideoComment[]>>({});
  const [commentOpenVideoId, setCommentOpenVideoId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentLoadingId, setCommentLoadingId] = useState<string | null>(null);
  const [commentSendingId, setCommentSendingId] = useState<string | null>(null);
  const [commentMessages, setCommentMessages] = useState<Record<string, string>>({});
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [videoViewCounts, setVideoViewCounts] = useState<Record<string, number>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistItems, setPlaylistItems] = useState<PlaylistVideo[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistIsPublic, setPlaylistIsPublic] = useState(false);
  const [playlistSelections, setPlaylistSelections] = useState<Record<string, string>>({});
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistSavingId, setPlaylistSavingId] = useState<string | null>(null);
  const [playlistMessage, setPlaylistMessage] = useState("");
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [publicPlaylistOwners, setPublicPlaylistOwners] = useState<Profile[]>([]);
  const [publicPlaylistVideos, setPublicPlaylistVideos] = useState<Video[]>([]);
  const [publicPlaylistVideoUrls, setPublicPlaylistVideoUrls] = useState<Record<string, string>>({});
  const [publicPlaylistItems, setPublicPlaylistItems] = useState<PlaylistVideo[]>([]);
  const [publicPlaylistsLoading, setPublicPlaylistsLoading] = useState(false);
  const [openPublicPlaylistId, setOpenPublicPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error.message);
        return;
      }
      setUser(data.session?.user ?? null);
    }

    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
          setAuthMessage("Choose a new password for your account.");
          setPage("auth");
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkDatabase() {
      const { error } = await supabase.from("videos").select("id", { count: "exact", head: true });
      setDatabaseStatus(error ? "Database connection needs attention." : "Database connected successfully.");
    }
    checkDatabase();
  }, []);

  async function loadMyVideos() {
    setLoadingVideos(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id,title,category,owner_id,storage_path,content_type,file_size,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus("Could not load videos: " + error.message);
      setLoadingVideos(false);
      return;
    }

    const list = (data ?? []) as Video[];
    setMyVideos(list);
    const urls: Record<string, string> = {};

    for (const video of list) {
      if (!video.storage_path) continue;
      const { data: signed, error: urlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(video.storage_path, 3600);
      if (!urlError && signed?.signedUrl) urls[video.id] = signed.signedUrl;
      else if (urlError) console.error("Video URL error:", video.id, urlError.message);
    }

    setVideoUrls(urls);
    setLoadingVideos(false);
  }

  async function loadOwnProfile(currentUser = user) {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,cover_url,bio")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      setProfileMessage("Could not load profile: " + error.message);
      return;
    }

    if (!data) {
      setProfileMessage("Profile record was not found. Please contact support.");
      return;
    }

    const p = data as Profile;
    setProfile(p);
    setProfileForm({
      username: p.username ?? "",
      display_name: p.display_name ?? "",
      bio: p.bio ?? "",
    });
  }

  useEffect(() => {
    loadMyVideos();
    loadOwnProfile(user);
  }, [user]);

  async function openProfile(profileId: string) {
    setProfileMessage("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,cover_url,bio")
      .eq("id", profileId)
      .maybeSingle();

    if (error || !data) {
      setStatus("Could not load this profile.");
      return;
    }

    setViewedProfile(data as Profile);
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("id,title,category,owner_id,storage_path,content_type,file_size,created_at")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: false });

    if (videosError) {
      setProfileVideos([]);
      setProfileVideoUrls({});
      setStatus("Profile loaded, but videos could not be loaded.");
    } else {
      const videoList = (videos ?? []) as Video[];
      setProfileVideos(videoList);
      const urls: Record<string, string> = {};
      for (const video of videoList) {
        if (!video.storage_path) continue;
        const { data: signed, error: signedError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(video.storage_path, 3600);
        if (signedError) console.error("Channel video URL error:", signedError.message);
        else if (signed?.signedUrl) urls[video.id] = signed.signedUrl;
      }
      setProfileVideoUrls(urls);
    }
    setPage("channel");
  }

  useEffect(() => {
    let active = true;
    async function loadSubscriptionState() {
      setSubscriptionMessage("");
      setSubscriberCount(0);
      setIsSubscribed(false);
      if (!viewedProfile) return;
      const { data: count, error: countError } = await supabase
        .rpc("tubexa_subscriber_count", { p_channel_id: viewedProfile.id });
      if (!active) return;
      if (countError) {
        setSubscriptionMessage("Could not load subscriber count.");
        return;
      }
      setSubscriberCount(Number(count ?? 0));
      if (user) {
        const { data: ownSubscription, error: ownError } = await supabase
          .from("subscribers")
          .select("id")
          .eq("channel_id", viewedProfile.id)
          .eq("subscriber_id", user.id)
          .maybeSingle();
        if (!active) return;
        if (ownError) {
          setSubscriptionMessage("Could not load your subscription status.");
          return;
        }
        setIsSubscribed(!!ownSubscription);
      }
    }
    loadSubscriptionState();
    return () => { active = false; };
  }, [viewedProfile, user]);

  useEffect(() => {
    let active = true;
    async function loadLikedVideos() {
      if (!user) { setLikedVideos([]); return; }
      const { data, error } = await supabase.from("video_likes").select("video_id").eq("user_id", user.id);
      if (!active) return;
      if (error) { console.error("Could not load liked videos:", error.message); return; }
      setLikedVideos((data ?? []).map((item: { video_id: string }) => item.video_id));
    }
    loadLikedVideos();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    async function loadSavedVideos() {
      if (!user) { setSavedVideoIds([]); return; }
      const { data, error } = await supabase.from("video_saves").select("video_id").eq("user_id", user.id);
      if (!active) return;
      if (error) { console.error("Could not load saved videos:", error.message); return; }
      setSavedVideoIds((data ?? []).map((item: { video_id: string }) => item.video_id));
    }
    loadSavedVideos();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    async function loadVideoViewCounts() {
      if (myVideos.length === 0) {
        setVideoViewCounts({});
        return;
      }
      const counts = await Promise.all(myVideos.map(async video => {
        const { data, error } = await supabase.rpc("tubexa_video_view_count", { p_video_id: video.id });
        if (error) {
          console.error("Could not load view count:", video.id, error.message);
          return [video.id, 0] as const;
        }
        return [video.id, Number(data ?? 0)] as const;
      }));
      if (active) setVideoViewCounts(Object.fromEntries(counts));
    }
    loadVideoViewCounts();
    return () => { active = false; };
  }, [myVideos]);

  async function recordVideoView(videoId: string) {
    if (!user) return;
    const { error } = await supabase.from("video_views").insert({
      video_id: videoId,
      viewer_id: user.id,
    });
    if (error && error.code !== "23505") {
      console.error("Could not record video view:", error.message);
      return;
    }
    const { data, error: countError } = await supabase.rpc("tubexa_video_view_count", { p_video_id: videoId });
    if (!countError) {
      setVideoViewCounts(current => ({ ...current, [videoId]: Number(data ?? 0) }));
    }
  }

  async function refreshPlaylists() {
    if (!user) {
      setPlaylists([]);
      setPlaylistItems([]);
      setPlaylistLoading(false);
      return;
    }
    setPlaylistLoading(true);
    const { data, error } = await supabase
      .from("playlists")
      .select("id,name,description,is_public,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setPlaylistMessage("Could not load playlists: " + error.message);
      setPlaylistLoading(false);
      return;
    }
    const list = (data ?? []) as Playlist[];
    setPlaylists(list);
    if (list.length === 0) {
      setPlaylistItems([]);
      setPlaylistLoading(false);
      return;
    }
    const { data: items, error: itemError } = await supabase
      .from("playlist_videos")
      .select("playlist_id,video_id,position,added_at")
      .in("playlist_id", list.map(item => item.id))
      .order("position", { ascending: true });
    if (itemError) setPlaylistMessage("Could not load playlist videos: " + itemError.message);
    else setPlaylistItems((items ?? []) as PlaylistVideo[]);
    setPlaylistLoading(false);
  }

  useEffect(() => {
    refreshPlaylists();
  }, [user]);

  useEffect(() => {
    let active = true;
    async function loadPublicPlaylists() {
      setPublicPlaylistsLoading(true);
      const { data, error } = await supabase
        .from("playlists")
        .select("id,name,description,is_public,created_at,owner_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!active) return;
      if (error) {
        console.error("Could not load public playlists:", error.message);
        setPublicPlaylists([]);
        setPublicPlaylistItems([]);
        setPublicPlaylistsLoading(false);
        return;
      }
      const list = (data ?? []) as Playlist[];
      setPublicPlaylists(list);
      if (list.length) {
        const ownerIds = [...new Set(list.map(item => item.owner_id).filter(Boolean))] as string[];
        const { data: owners, error: ownersError } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url,cover_url,bio")
          .in("id", ownerIds);
        if (!active) return;
        if (ownersError) {
          console.error("Could not load public playlist creators:", ownersError.message);
          setPublicPlaylistOwners([]);
        } else {
          setPublicPlaylistOwners((owners ?? []) as Profile[]);
        }
      } else {
        setPublicPlaylistOwners([]);
      }
      if (!list.length) {
        setPublicPlaylistItems([]);
        setPublicPlaylistsLoading(false);
        return;
      }
      const { data: items, error: itemsError } = await supabase
        .from("playlist_videos")
        .select("playlist_id,video_id,position,added_at")
        .in("playlist_id", list.map(item => item.id))
        .order("position", { ascending: true });
      if (!active) return;
      if (itemsError) {
        console.error("Could not load public playlist videos:", itemsError.message);
        setPublicPlaylistItems([]);
        setPublicPlaylistVideos([]);
        setPublicPlaylistVideoUrls({});
      } else {
        const playlistRows = (items ?? []) as PlaylistVideo[];
        setPublicPlaylistItems(playlistRows);
        const videoIds = [...new Set(playlistRows.map(item => item.video_id))];
        if (videoIds.length) {
          const { data: videos, error: videosError } = await supabase
            .from("videos")
            .select("id,title,category,owner_id,storage_path,content_type,file_size,created_at")
            .in("id", videoIds);
          if (!active) return;
          if (videosError) {
            console.error("Could not load public playlist video details:", videosError.message);
            setPublicPlaylistVideos([]);
          } else {
            const videoList = (videos ?? []) as Video[];
            setPublicPlaylistVideos(videoList);
            const urls: Record<string, string> = {};
            for (const video of videoList) {
              if (!video.storage_path) continue;
              const { data: signed, error: signedError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrl(video.storage_path, 3600);
              if (signedError) console.error("Public playlist video URL error:", signedError.message);
              else if (signed?.signedUrl) urls[video.id] = signed.signedUrl;
            }
            if (!active) return;
            setPublicPlaylistVideoUrls(urls);
          }
        } else {
          setPublicPlaylistVideos([]);
          setPublicPlaylistVideoUrls({});
        }
      }
      setPublicPlaylistsLoading(false);
    }
    loadPublicPlaylists();
    return () => { active = false; };
  }, []);

  async function createPlaylist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { setPage("auth"); return; }
    const name = playlistName.trim();
    if (!name) { setPlaylistMessage("Please enter a playlist name."); return; }
    setPlaylistSavingId("create");
    setPlaylistMessage("");
    const { error } = await supabase.from("playlists").insert({
      owner_id: user.id,
      name,
      description: playlistDescription.trim(),
      is_public: playlistIsPublic,
    });
    if (error) setPlaylistMessage("Could not create playlist: " + error.message);
    else {
      setPlaylistName("");
      setPlaylistDescription("");
      setPlaylistIsPublic(false);
      setPlaylistMessage("Playlist created successfully.");
      await refreshPlaylists();
    }
    setPlaylistSavingId(null);
  }

  async function addVideoToPlaylist(videoId: string) {
    const playlistId = playlistSelections[videoId];
    if (!user) { setPage("auth"); return; }
    if (!playlistId) { setPlaylistMessage("Choose a playlist first."); return; }
    setPlaylistSavingId(videoId);
    setPlaylistMessage("");
    const nextPosition = playlistItems.filter(item => item.playlist_id === playlistId).length;
    const { error } = await supabase.from("playlist_videos").insert({ playlist_id: playlistId, video_id: videoId, position: nextPosition });
    if (error?.code === "23505") setPlaylistMessage("This video is already in that playlist.");
    else if (error) setPlaylistMessage("Could not add video: " + error.message);
    else {
      setPlaylistMessage("Video added to playlist.");
      await refreshPlaylists();
    }
    setPlaylistSavingId(null);
  }

  async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
    const key = playlistId + ":" + videoId;
    setPlaylistSavingId(key);
    const { error } = await supabase.from("playlist_videos")
      .delete().eq("playlist_id", playlistId).eq("video_id", videoId);
    if (error) setPlaylistMessage("Could not remove video: " + error.message);
    else {
      setPlaylistItems(current => current.filter(item => !(item.playlist_id === playlistId && item.video_id === videoId)));
      setPlaylistMessage("Video removed from playlist.");
    }
    setPlaylistSavingId(null);
  }

  async function togglePlaylistVisibility(playlist: Playlist) {
    setPlaylistSavingId(playlist.id);
    const { error } = await supabase.from("playlists")
      .update({ is_public: !playlist.is_public, updated_at: new Date().toISOString() })
      .eq("id", playlist.id).eq("owner_id", user.id);
    if (error) setPlaylistMessage("Could not update playlist: " + error.message);
    else {
      setPlaylists(current => current.map(item => item.id === playlist.id ? { ...item, is_public: !item.is_public } : item));
      setPlaylistMessage(playlist.is_public ? "Playlist is now private." : "Playlist is now public.");
    }
    setPlaylistSavingId(null);
  }

  async function deletePlaylist(playlistId: string) {
    if (!window.confirm("Delete this playlist? Its saved list will also be removed.")) return;
    setPlaylistSavingId(playlistId);
    const { error } = await supabase.from("playlists").delete().eq("id", playlistId).eq("owner_id", user.id);
    if (error) setPlaylistMessage("Could not delete playlist: " + error.message);
    else {
      setPlaylists(current => current.filter(item => item.id !== playlistId));
      setPlaylistItems(current => current.filter(item => item.playlist_id !== playlistId));
      setPlaylistMessage("Playlist deleted.");
    }
    setPlaylistSavingId(null);
  }

  async function toggleVideoLike(videoId: string) {
    if (!user) { setPage("auth"); return; }
    if (likeLoading) return;
    setLikeLoading(videoId);
    try {
      if (likedVideos.includes(videoId)) {
        const { error } = await supabase.from("video_likes").delete().eq("video_id", videoId).eq("user_id", user.id);
        if (error) throw error;
        setLikedVideos(current => current.filter(id => id !== videoId));
      } else {
        const { error } = await supabase.from("video_likes").insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;
        setLikedVideos(current => [...current, videoId]);
      }
    } catch (error: any) {
      setStatus(error?.message || "Your Like could not be updated.");
    } finally {
      setLikeLoading(null);
    }
  }

  async function toggleVideoSave(videoId: string) {
    if (!user) { setPage("auth"); return; }
    if (saveLoading) return;
    setSaveLoading(videoId);
    try {
      if (savedVideoIds.includes(videoId)) {
        const { error } = await supabase.from("video_saves").delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);
        if (error) throw error;
        setSavedVideoIds(current => current.filter(id => id !== videoId));
      } else {
        const { error } = await supabase.from("video_saves").insert({
          video_id: videoId,
          user_id: user.id,
        });
        if (error) throw error;
        setSavedVideoIds(current => [...current, videoId]);
      }
    } catch (error: any) {
      setStatus(error?.message || "Saved video could not be updated.");
    } finally {
      setSaveLoading(null);
    }
  }

  async function loadVideoComments(videoId: string) {
    setCommentLoadingId(videoId);
    setCommentMessages(current => ({ ...current, [videoId]: "" }));
    try {
      const { data, error } = await supabase
        .from("video_comments")
        .select("id,video_id,author_id,content,created_at")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as Omit<VideoComment, "author">[];
      const authorIds = [...new Set(rows.map(comment => comment.author_id))];
      const authors: Record<string, VideoComment["author"]> = {};
      if (authorIds.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", authorIds);
        if (profilesError) throw profilesError;
        for (const author of profiles ?? []) {
          authors[author.id] = {
            username: author.username,
            display_name: author.display_name,
            avatar_url: author.avatar_url,
          };
        }
      }
      setCommentsByVideo(current => ({
        ...current,
        [videoId]: rows.map(comment => ({ ...comment, author: authors[comment.author_id] ?? null })),
      }));
    } catch (error: any) {
      setCommentMessages(current => ({
        ...current,
        [videoId]: error?.message || "Comments could not be loaded.",
      }));
    } finally {
      setCommentLoadingId(null);
    }
  }

  async function toggleVideoComments(videoId: string) {
    if (commentOpenVideoId === videoId) {
      setCommentOpenVideoId(null);
      return;
    }
    setCommentOpenVideoId(videoId);
    await loadVideoComments(videoId);
  }

  async function submitVideoComment(videoId: string) {
    if (!user) {
      setPage("auth");
      return;
    }
    if (commentSendingId) return;
    const content = (commentDrafts[videoId] ?? "").trim();
    if (!content) {
      setCommentMessages(current => ({ ...current, [videoId]: "Write a comment first." }));
      return;
    }
    if (content.length > 1000) {
      setCommentMessages(current => ({ ...current, [videoId]: "Comments must be 1,000 characters or fewer." }));
      return;
    }
    setCommentSendingId(videoId);
    setCommentMessages(current => ({ ...current, [videoId]: "" }));
    try {
      const { error } = await supabase.from("video_comments").insert({
        video_id: videoId,
        author_id: user.id,
        content,
      });
      if (error) throw error;
      setCommentDrafts(current => ({ ...current, [videoId]: "" }));
      await loadVideoComments(videoId);
    } catch (error: any) {
      setCommentMessages(current => ({
        ...current,
        [videoId]: error?.message || "Your comment could not be posted.",
      }));
    } finally {
      setCommentSendingId(null);
    }
  }

  async function deleteVideoComment(commentId: string, videoId: string) {
    if (!user) return;
    setCommentMessages(current => ({ ...current, [videoId]: "" }));
    const { error } = await supabase
      .from("video_comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id);
    if (error) {
      setCommentMessages(current => ({ ...current, [videoId]: error.message }));
      return;
    }
    setCommentsByVideo(current => ({
      ...current,
      [videoId]: (current[videoId] ?? []).filter(comment => comment.id !== commentId),
    }));
  }

  async function toggleSubscription() {
    if (!viewedProfile || !user || subscriptionLoading) return;
    if (viewedProfile.id === user.id) return;
    setSubscriptionLoading(true);
    setSubscriptionMessage("");
    try {
      if (isSubscribed) {
        const { error } = await supabase.from("subscribers").delete()
          .eq("channel_id", viewedProfile.id)
          .eq("subscriber_id", user.id);
        if (error) throw error;
        setIsSubscribed(false);
        setSubscriberCount(value => Math.max(0, value - 1));
      } else {
        const { error } = await supabase.from("subscribers").insert({
          subscriber_id: user.id,
          channel_id: viewedProfile.id,
        });
        if (error) throw error;
        setIsSubscribed(true);
        setSubscriberCount(value => value + 1);
      }
    } catch (error: any) {
      setSubscriptionMessage(error?.message || "Subscription could not be updated.");
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function uploadProfileImage(file: File, kind: "avatar" | "cover") {
    if (!user) throw new Error("Please log in first.");
    if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Profile images must be 5 MB or smaller.");

    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    const path = `${user.id}/${kind}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || profileLoading) return;

    const username = profileForm.username.trim().toLowerCase();
    const displayName = profileForm.display_name.trim();
    const bio = profileForm.bio.trim();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setProfileMessage("Username must be 3–20 characters and use only English letters, numbers or underscore.");
      return;
    }
    if (!displayName) {
      setProfileMessage("Please enter your display name.");
      return;
    }

    setProfileLoading(true);
    setProfileMessage("Saving profile...");

    try {
      let avatarUrl = profile?.avatar_url ?? null;
      let coverUrl = profile?.cover_url ?? null;

      if (avatarFile) avatarUrl = await uploadProfileImage(avatarFile, "avatar");
      if (coverFile) coverUrl = await uploadProfileImage(coverFile, "cover");

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
        }, { onConflict: "id" })
        .select("id,username,display_name,avatar_url,cover_url,bio")
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      setAvatarFile(null);
      setCoverFile(null);
      setProfileMessage("Profile saved successfully!");
    } catch (error: any) {
      const message = error?.message || "Could not save profile.";
      setProfileMessage(
        message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")
          ? "This username is already taken. Please choose another one."
          : message
      );
    } finally {
      setProfileLoading(false);
    }
    }

  async function handleOAuthLogin(provider: "google" | "apple") {
    setAuthMessage("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setAuthMessage(error.message);
      setAuthLoading(false);
    }
  }

  async function handleSendPhoneOtp() {
    setAuthMessage("");
    const normalizedPhone = phoneNumber.trim().replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setAuthMessage("Enter your phone number with country code, for example +923001234567.");
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setPhoneNumber(normalizedPhone);
      setPhoneOtpSent(true);
      setAuthMessage("A verification code has been sent by SMS. Enter the 6-digit code below.");
    } catch (error: any) {
      setAuthMessage(error?.message || "Could not send the SMS code. Phone sign-in may need to be enabled in Supabase.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerifyPhoneOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    const normalizedPhone = phoneNumber.trim().replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setAuthMessage("Enter a valid phone number with country code.");
      return;
    }
    if (!/^\d{6}$/.test(phoneOtp.trim())) {
      setAuthMessage("Enter the 6-digit SMS verification code.");
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: phoneOtp.trim(),
        type: "sms",
      });
      if (error) throw error;
      if (data.user) setUser(data.user);
      setPage("home");
      setPhoneOtp("");
      setPhoneOtpSent(false);
      setAuthMessage("Phone number verified. You are now logged in.");
    } catch (error: any) {
      setAuthMessage(error?.message || "The verification code could not be confirmed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword() {
    setAuthMessage("");
    const address = email.trim();
    if (!address) {
      setAuthMessage("Enter your email address first.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(address, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setAuthMessage("If this email is registered, a password reset link has been sent. Check your inbox.");
    } catch (error: any) {
      setAuthMessage(error?.message || "Could not send the password reset email.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleUpdatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    if (newPassword.length < 8) {
      setAuthMessage("Your new password must be at least 8 characters long.");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setPasswordRecovery(false);
      setAuthMessage("Password updated successfully. Your account is ready.");
      setPage("home");
    } catch (error: any) {
      setAuthMessage(error?.message || "Could not update your password. Please request a new reset link.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.session) {
          setUser(data.session.user);
          setPage("home");
          setAuthMessage("Account created successfully!");
        } else {
          setAuthMessage("Account created! Please confirm your email.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setUser(data.user);
        setPage("home");
        setAuthMessage("Login successful!");
      }
    } catch (error: any) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setUser(null);
    setProfile(null);
    setViewedProfile(null);
    setPage("home");
    setStatus("");
    setSearch("");
    setSearchInput("");
  }

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setStatus("");
    if (!file) {
      setVideoFile(null);
      return;
    }
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      setStatus("Please select an MP4, WebM or MOV video.");
      setVideoFile(null);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("Video must be 50 MB or smaller.");
      setVideoFile(null);
      event.target.value = "";
      return;
    }
    setVideoFile(file);
    setStatus("Video selected successfully.");
  }

  async function uploadVideo() {
    if (!user) {
      setStatus("Please log in before uploading a video.");
      setPage("auth");
      return;
    }
    if (!videoFile) {
      setStatus("Please select a video first.");
      return;
    }
    if (uploading) return;

    setUploading(true);
    setStatus("Uploading your video...");
    const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, videoFile, { contentType: videoFile.type, upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("videos").insert({
        owner_id: user.id,
        title: videoFile.name,
        category: uploadCategory,
        storage_path: path,
        content_type: videoFile.type,
        file_size: videoFile.size,
      });

      if (insertError) {
        await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        throw insertError;
      }

      setVideoFile(null);
      const input = document.getElementById("video-upload") as HTMLInputElement | null;
      if (input) input.value = "";
      setStatus("Video uploaded successfully!");
      await loadMyVideos();
    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus("Upload failed: " + (error.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  }

  async function deleteVideo(video: Video) {
    if (!user) return;
    if (video.owner_id !== user.id) {
      setStatus("You can only delete your own videos.");
      return;
    }
    if (!window.confirm(`Delete "${video.title}"?`)) return;

    setStatus("Deleting video...");
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([video.storage_path]);
    if (storageError) {
      setStatus("Could not delete video: " + storageError.message);
      return;
    }
    const { error: dbError } = await supabase.from("videos").delete().eq("id", video.id).eq("owner_id", user.id);
    if (dbError) {
      setStatus("File deleted, but database record could not be deleted: " + dbError.message);
      return;
    }
    setPlayingVideo(null);
    setSettingsVideo(null);
    setStatus("Video deleted successfully.");
    await loadMyVideos();
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPlayingVideo(null);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = myVideos.filter(video => {
      const matchesCategory = category === "All" || video.category === category;
      const matchesSearch = !query || (video.title || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
    return [...matches].sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "views") return (videoViewCounts[b.id] ?? 0) - (videoViewCounts[a.id] ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [myVideos, search, category, sortBy, videoViewCounts]);

  const myUploadedVideos = useMemo(() => {
    if (!user) return [];
    return filteredVideos.filter(video => video.owner_id === user.id);
  }, [filteredVideos, user]);

  const savedVideos = useMemo(
    () => myVideos.filter(video => savedVideoIds.includes(video.id)),
    [myVideos, savedVideoIds]
  );

  function playVideo() {
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) {
      setVideoId(match[1]);
      setStatus("");
    } else {
      setVideoId("");
      setStatus("Please enter a valid YouTube video URL.");
    }
  }

  const styles = `
    *{box-sizing:border-box}
    body{margin:0;background:#090a0e;color:#fff;font-family:Arial,sans-serif}
    button,input,select,textarea{font:inherit}
    button{cursor:pointer}
    button:disabled{opacity:.6;cursor:not-allowed}
    .app{min-height:100vh;background:radial-gradient(ellipse at top,#24101b,#090a0e 48%)}
    .topbar{min-height:72px;padding:12px 5%;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid #29252b;background:#0b0b0dee;position:sticky;top:0;z-index:5;flex-wrap:wrap}
    .logo{font-size:27px;font-weight:900;letter-spacing:2px;white-space:nowrap}
    .logo span{color:#ff3155}
    .search-form{width:min(430px,48vw);display:flex;align-items:center;gap:7px}
    .search{width:100%;min-width:0;background:#17171d;border:1px solid #35323a;border-radius:30px;padding:12px 17px;color:white;outline:none}
    .search:focus{border-color:#ff3155;box-shadow:0 0 0 2px #ff315533}
    .search-button{width:45px;height:45px;flex-shrink:0;border:0;border-radius:50%;background:#ff3155;color:white;font-size:21px}
    .clear-button{height:42px;width:42px;flex-shrink:0;border:1px solid #39343d;background:#17151b;color:#ddd;border-radius:50%;font-size:19px}
    .nav{display:flex;gap:8px;flex-wrap:wrap}
    .nav button,.chip{border:1px solid #39343d;background:#17151b;color:#ddd;padding:10px 14px;border-radius:24px}
    .nav button.active,.chip.active,.primary{background:#ff3155;border-color:#ff3155;color:white}
    .hero{padding:60px 6% 40px;max-width:1300px;margin:auto}
    .tag{color:#ff5874;font-weight:bold;letter-spacing:3px;font-size:12px}
    h1{font-size:clamp(38px,7vw,68px);line-height:1.05;margin:17px 0}
    h1 span{color:#ff3155}
    .sub{color:#aaa;line-height:1.7;max-width:650px}
    .section{max-width:1300px;margin:auto;padding:12px 6% 42px}
    .section-title{font-size:23px;margin:12px 0 20px}
    .categories{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:25px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:17px}
    .card{background:#15151b;border:1px solid #292832;border-radius:15px;overflow:hidden}
    .thumb{height:140px;display:grid;place-items:center;font-size:45px}
    .card-info{padding:14px}
    .card-info h3{margin:0 0 8px;font-size:17px;overflow-wrap:anywhere}
    .muted{color:#999;font-size:13px}
    .panel{background:#15151b;border:1px solid #302b34;border-radius:16px;padding:22px}
    .field{display:flex;flex-direction:column;gap:9px;margin:17px 0}
    .field label{color:#ddd;font-size:14px;font-weight:bold}
    .field input,.field select,.field textarea{width:100%;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:13px}
    .field textarea{min-height:100px;resize:vertical}
    .primary{border:0;border-radius:9px;padding:13px 20px;font-weight:bold}
    .google-button{width:100%;display:flex;justify-content:center;align-items:center;gap:12px;padding:13px;background:#fff;color:#222;border:1px solid #ddd;border-radius:9px;font-weight:bold;margin-top:18px}
    .google-icon{font-size:19px;font-weight:900;color:#4285f4}
    .divider{display:flex;align-items:center;gap:12px;color:#888;font-size:12px;margin:20px 0}
    .divider:before,.divider:after{content:"";height:1px;background:#39343d;flex:1}
    .upload{border:2px dashed #51404b;border-radius:13px;padding:28px;text-align:center;background:#100f14}
    .upload input{margin-top:15px;max-width:100%}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .notice{padding:13px;border-radius:9px;background:#28202a;color:#ffbdca;line-height:1.6;margin-top:15px;font-size:13px;overflow-wrap:anywhere}
    .player{width:100%;aspect-ratio:16/9;background:#050505;border-radius:10px;overflow:hidden;display:grid;place-items:center;color:#999;text-align:center;position:relative}
    .player iframe,.player video{width:100%;height:100%;border:0;object-fit:contain}
    .urlrow{display:flex;gap:10px;margin-top:15px}
    .urlrow input{flex:1;min-width:0;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:13px}
    .message{color:#ff91a4;margin-top:12px;line-height:1.6;overflow-wrap:anywhere}
    .db-status{font-size:12px;color:#aaa;margin-top:12px}
    .auth-panel{max-width:470px;margin:10px auto 50px}
    .auth-panel h2{text-align:center;margin-top:5px}
    .auth-switch{background:none;border:0;color:#ff5874;padding:10px}
    .auth-actions{display:flex;justify-content:center;align-items:center;gap:5px;flex-wrap:wrap;margin-top:12px}
    .account-email{font-size:12px;color:#aaa;max-width:150px;overflow-wrap:anywhere}
    .video-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .video-actions button{flex:1}
    .danger{background:#7d2035;color:white;border:0;border-radius:8px;padding:10px}
    .video-preview{width:100%;aspect-ratio:16/9;background:#050505;object-fit:contain}
    .settings-wrap{position:relative;margin-top:12px}
    .settings-button{background:#29232c;color:white;border:1px solid #51404b;border-radius:9px;padding:10px 14px}
    .settings-panel{background:#17151d;border:1px solid #51404b;border-radius:12px;padding:15px;margin-top:10px}
    .settings-panel select{width:100%;background:#090a0e;border:1px solid #51404b;color:white;border-radius:8px;padding:12px;margin:8px 0 14px}
    .settings-panel label{display:block;font-size:13px;color:#ddd;margin-top:8px}
    .settings-note{font-size:12px;color:#ffbdca;line-height:1.5;margin-top:8px}
    .profile-cover{height:210px;border-radius:14px;background:#28202c center/cover no-repeat;position:relative;overflow:hidden}
    .profile-head{display:flex;align-items:center;gap:18px;margin-top:-48px;padding:0 22px;position:relative;flex-wrap:wrap}
    .avatar{width:112px;height:112px;border-radius:50%;border:5px solid #15151b;background:#39313d;object-fit:cover;display:grid;place-items:center;font-size:38px}
    .profile-name{padding-top:48px}
    .profile-name h2{margin:0 0 7px}
        .profile-link{background:#28202c;color:#ffbdca;border:1px solid #51404b;border-radius:8px;padding:9px 12px}
    .comments-area{margin-top:10px}
    .comments-panel{margin-top:10px;padding:13px;background:#100f14;border:1px solid #39343d;border-radius:12px}
    .comments-panel textarea{width:100%;min-height:76px;resize:vertical;background:#090a0e;border:1px solid #39343d;color:white;border-radius:9px;padding:11px}
    .comment-form-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px}
    .comment-list{display:flex;flex-direction:column;gap:13px;margin-top:15px}
    .comment-item{display:flex;align-items:flex-start;gap:10px;padding-top:12px;border-top:1px solid #302b34}
    .comment-item img,.comment-avatar{width:34px;height:34px;flex:0 0 34px;border-radius:50%;object-fit:cover;background:#39313d;display:grid;place-items:center}
    .comment-body{min-width:0;flex:1}
    .comment-body strong{font-size:13px}
    .comment-body p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere;color:#eee;font-size:14px}
    .comment-delete{background:transparent;border:0;color:#ff91a4;font-size:12px;padding:5px}
    footer{text-align:center;padding:28px;color:#777;border-top:1px solid #29252b}
    @media(max-width:700px){.search-form{width:100%;order:3}.two{grid-template-columns:1fr}.urlrow{flex-direction:column}.urlrow button{width:100%}.hero{padding-top:40px}.topbar{justify-content:flex-start}.profile-cover{height:150px}}
  `;

  const displayName = (p: Profile | null) => p?.display_name || p?.username || "TUBEXA User";

  function renderAddToPlaylist(videoId: string) {
    if (!user) return null;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <select
          aria-label="Choose playlist"
          value={playlistSelections[videoId] ?? ""}
          onChange={event => setPlaylistSelections(current => ({ ...current, [videoId]: event.target.value }))}
          style={{ flex: "1 1 150px", minWidth: 0, background: "#17171d", color: "#fff", border: "1px solid #39343d", borderRadius: 10, padding: "9px 12px" }}
        >
          <option value="">Choose playlist</option>
          {playlists.map(playlist => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
        </select>
        <button className="profile-link" onClick={() => addVideoToPlaylist(videoId)} disabled={!playlists.length || playlistSavingId === videoId}>
          {playlistSavingId === videoId ? "Adding..." : "＋ Add to Playlist"}
        </button>
      </div>
    );
  }

  function renderVideoComments(videoId: string) {
    const isOpen = commentOpenVideoId === videoId;
    const comments = commentsByVideo[videoId] ?? [];
    return (
      <div className="comments-area">
        {renderAddToPlaylist(videoId)}
        <button className="profile-link" style={{ marginTop: 10 }} onClick={() => toggleVideoComments(videoId)}>
          {isOpen ? "Hide Comments" : "Comments"}
        </button>
        {isOpen && (
          <div className="comments-panel">
            {user ? (
              <form onSubmit={event => { event.preventDefault(); submitVideoComment(videoId); }}>
                <textarea
                  value={commentDrafts[videoId] ?? ""}
                  onChange={event => setCommentDrafts(current => ({ ...current, [videoId]: event.target.value }))}
                  maxLength={1000}
                  placeholder="Write a comment..."
                  aria-label="Write a comment"
                />
                <div className="comment-form-footer">
                  <span className="muted">{(commentDrafts[videoId] ?? "").length}/1000</span>
                  <button className="primary" type="submit" disabled={commentSendingId === videoId}>
                    {commentSendingId === videoId ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            ) : (
              <button className="profile-link" onClick={() => setPage("auth")}>Login to Comment</button>
            )}
            {commentMessages[videoId] && <div className="message">{commentMessages[videoId]}</div>}
            {commentLoadingId === videoId ? <p className="muted">Loading comments...</p> : comments.length === 0 ? (
              <p className="muted">No comments yet. Start the conversation.</p>
            ) : (
              <div className="comment-list">
                {comments.map(comment => (
                  <div className="comment-item" key={comment.id}>
                    {comment.author?.avatar_url ? <img src={comment.author.avatar_url} alt="" /> : <div className="comment-avatar">👤</div>}
                    <div className="comment-body">
                      <strong>{comment.author?.display_name || comment.author?.username || "TUBEXA User"}</strong>
                      <p>{comment.content}</p>
                      <span className="muted">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    {user?.id === comment.author_id && (
                      <button className="comment-delete" onClick={() => deleteVideoComment(comment.id, videoId)} aria-label="Delete your comment">Delete</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="topbar">
        <div className="logo" onClick={() => setPage("home")} style={{ cursor: "pointer" }}>TUBE<span>XA</span></div>
        <div className="nav">
          <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>Home</button>
          <button onClick={() => { setPage("upload"); setStatus(""); }}>Upload Video</button>
          {user && <button className={page === "profile" ? "active" : ""} onClick={() => { loadOwnProfile(); setPage("profile"); }}>My Profile</button>}
          {user ? <button onClick={handleLogout}>Logout</button> : <button className={page === "auth" ? "active" : ""} onClick={() => setPage("auth")}>Login / Sign Up</button>}
        </div>
        {user && <div className="account-email">{profile?.display_name || user.email}</div>}
        {page === "home" && (
          <form className="search-form" onSubmit={handleSearch}>
            <input className="search" type="search" placeholder="Search all videos..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            {searchInput && <button type="button" className="clear-button" onClick={clearSearch} aria-label="Clear search">×</button>}
            <button type="submit" className="search-button" aria-label="Search">🔍</button>
          </form>
        )}
      </header>

      {page === "auth" ? (
        <main>
          <section className="hero"><div className="tag">WELCOME TO TUBEXA</div><h1>Your Account.<br /><span>Your Video World.</span></h1><p className="sub">Create your account or log in to continue.</p></section>
          <section className="section">
            <div className="panel auth-panel">
              <h2>{passwordRecovery ? "Set a New Password" : authMethod === "phone" ? "Continue with Phone" : authMode === "signup" ? "Create Account" : "Welcome Back"}</h2>
              {!passwordRecovery && <><button type="button" className="google-button" onClick={() => handleOAuthLogin("google")} disabled={authLoading}><span className="google-icon">G</span>{authLoading ? "Connecting..." : "Continue with Google"}</button>
              <button type="button" className="google-button" onClick={() => handleOAuthLogin("apple")} disabled={authLoading}><span aria-hidden="true" style={{ fontSize: 19, color: "#111" }}>●</span>{authLoading ? "Connecting..." : "Continue with Apple"}</button>
              <button type="button" className="google-button" onClick={() => { setAuthMethod("phone"); setPhoneOtpSent(false); setPhoneOtp(""); setAuthMessage(""); }} disabled={authLoading}>Continue with Phone Number</button>
              <div className="divider">{authMethod === "phone" ? "PHONE VERIFICATION" : "OR CONTINUE WITH EMAIL"}</div>
              {authMethod === "phone" ? (
                <form onSubmit={phoneOtpSent ? handleVerifyPhoneOtp : (event) => { event.preventDefault(); void handleSendPhoneOtp(); }}>
                  <div className="field"><label>Phone Number (with country code)</label><input type="tel" inputMode="tel" value={phoneNumber} onChange={e => { setPhoneNumber(e.target.value); setPhoneOtpSent(false); setPhoneOtp(""); }} placeholder="+923001234567" required autoComplete="tel" /></div>
                  {phoneOtpSent && <div className="field"><label>6-digit SMS code</label><input type="text" inputMode="numeric" autoComplete="one-time-code" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter verification code" required maxLength={6} /></div>}
                  <button className="primary" type="submit" disabled={authLoading} style={{ width: "100%" }}>{authLoading ? "Please wait..." : phoneOtpSent ? "Verify Code & Continue" : "Send SMS Code"}</button>
                  {phoneOtpSent && <button type="button" className="auth-switch" onClick={() => { setPhoneOtp(""); void handleSendPhoneOtp(); }} disabled={authLoading}>Resend code</button>}
                  <button type="button" className="auth-switch" onClick={() => { setAuthMethod("email"); setPhoneOtpSent(false); setPhoneOtp(""); setAuthMessage(""); }}>Use email instead</button>
                </form>
              ) : (
                <form onSubmit={handleAuth}>
                  <div className="field"><label>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required autoComplete="email" /></div>
                  <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} /></div>
                  <button className="primary" type="submit" disabled={authLoading} style={{ width: "100%" }}>{authLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Login"}</button>
                  {authMode === "login" && <button type="button" className="auth-switch" onClick={handleForgotPassword} disabled={authLoading}>Forgot password?</button>}
                </form>
              )}
              </>}
              {passwordRecovery ? (
                <form onSubmit={handleUpdatePassword}>
                  <div className="field"><label>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete="new-password" /></div>
                  <button className="primary" type="submit" disabled={authLoading} style={{ width: "100%" }}>{authLoading ? "Updating..." : "Update Password"}</button>
                </form>
              ) : null}
                            {authMessage && <div className="notice">{authMessage}</div>}
              {!passwordRecovery && authMethod === "email" && <div className="auth-actions"><span className="muted">{authMode === "signup" ? "Already have an account?" : "New to TUBEXA?"}</span><button className="auth-switch" onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthMessage(""); }}>{authMode === "signup" ? "Login" : "Sign Up"}</button></div>}
            </div>
          </section>
        </main>
      ) : page === "profile" ? (
        <main>
          <section className="hero"><div className="tag">YOUR TUBEXA ACCOUNT</div><h1>My <span>Profile</span></h1><p className="sub">اپنا نام، Username، تصویر، کور فوٹو اور تعارف تبدیل کریں۔</p></section>
          <section className="section">
            {!user ? <div className="notice">پروفائل تبدیل کرنے کے لیے پہلے لاگ اِن کریں۔</div> : (
              <>
                <div className="panel">
                  <div className="profile-cover" style={{ backgroundImage: profile?.cover_url ? `url("${profile.cover_url}")` : undefined }} />
                  <div className="profile-head">
                    {profile?.avatar_url ? <img className="avatar" src={profile.avatar_url} alt="Profile" /> : <div className="avatar">👤</div>}
                    <div className="profile-name"><h2>{displayName(profile)}</h2><div className="muted">@{profile?.username || "username-not-set"}</div></div>
                  </div>
                </div>
                <form className="panel" style={{ marginTop: 20 }} onSubmit={saveProfile}>
                  <h2 className="section-title">Edit Your Profile</h2>
                  <div className="two">
                    <div className="field"><label>Display Name</label><input value={profileForm.display_name} onChange={e => setProfileForm({ ...profileForm, display_name: e.target.value })} maxLength={50} required placeholder="Your name" /></div>
                    <div className="field"><label>Unique Username</label><input value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} maxLength={20} required placeholder="your_username" /><span className="muted">3–20 characters: a-z, 0-9, underscore</span></div>
                  </div>
                  <div className="field"><label>Bio</label><textarea value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} maxLength={300} placeholder="Tell viewers a little about yourself..." /></div>
                  <div className="two">
                    <div className="field"><label>Profile Picture (max 5 MB)</label><input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)} /></div>
                    <div className="field"><label>Cover Photo (max 5 MB)</label><input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)} /></div>
                  </div>
                  <button className="primary" type="submit" disabled={profileLoading}>{profileLoading ? "Saving..." : "Save Profile"}</button>
                  {profileMessage && <div className="notice">{profileMessage}</div>}
                </form>
              </>
            )}
          </section>
        </main>
      ) : page === "channel" && viewedProfile ? (
        <main>
          <section className="section" style={{ paddingTop: 35 }}>
            <div className="profile-cover" style={{ backgroundImage: viewedProfile.cover_url ? `url("${viewedProfile.cover_url}")` : undefined }} />
            <div className="profile-head">
              {viewedProfile.avatar_url ? <img className="avatar" src={viewedProfile.avatar_url} alt="Profile" /> : <div className="avatar">👤</div>}
              <div className="profile-name"><h2>{displayName(viewedProfile)}</h2><div className="muted">@{viewedProfile.username || "username-not-set"}</div></div>
            </div>
            {viewedProfile.bio && <p className="sub" style={{ marginTop: 20 }}>{viewedProfile.bio}</p>}
            <div className="panel" style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
              <div><strong>{subscriberCount}</strong><div className="muted">Subscribers</div></div>
              {user && viewedProfile.id !== user.id ? (
                <button className="primary" onClick={toggleSubscription} disabled={subscriptionLoading}>
                  {subscriptionLoading ? "Please wait..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              ) : !user ? (
                <button className="primary" onClick={() => setPage("auth")}>Login to Subscribe</button>
              ) : <span className="muted">This is your channel</span>}
              {subscriptionMessage && <div className="message" style={{ width: "100%" }}>{subscriptionMessage}</div>}
            </div>
            <h2 className="section-title" style={{ marginTop: 35 }}>Channel Videos</h2>
            {profileVideos.length === 0 ? <div className="notice">اس چینل پر ابھی کوئی ویڈیو موجود نہیں۔</div> : (
              <div className="grid">
                {profileVideos.map(video => (
                  <article className="card" key={video.id}>
                    {playingVideo === video.id && profileVideoUrls[video.id] ? <video className="video-preview" src={profileVideoUrls[video.id]} controls playsInline onPlay={() => { void recordVideoView(video.id); }} /> : <div className="thumb">▶️</div>}
                    <div className="card-info"><h3>{video.title}</h3><div className="muted">Views: {videoViewCounts[video.id] ?? 0} · Unique signed-in viewers</div><button className="primary" disabled={!profileVideoUrls[video.id]} onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}>{playingVideo === video.id ? "Close Player" : "Play"}</button><button className="profile-link" style={{ marginTop: 10 }} onClick={() => toggleVideoLike(video.id)} disabled={likeLoading === video.id}>{likeLoading === video.id ? "Please wait..." : likedVideos.includes(video.id) ? "♥ Liked" : "♡ Like"}</button><button className="profile-link" style={{ marginTop: 10 }} onClick={() => toggleVideoSave(video.id)} disabled={saveLoading === video.id}>{saveLoading === video.id ? "Please wait..." : savedVideoIds.includes(video.id) ? "✓ Saved" : "＋ Save"}</button></div>
                    {renderVideoComments(video.id)}
                  </article>
                ))}
              </div>
            )}
            <button className="profile-link" style={{ marginTop: 20 }} onClick={() => setPage("home")}>← Back to Home</button>
          </section>
        </main>
      ) : page === "home" ? (
        <main>
          <section className="hero">
            <div className="tag">YOUR VIDEO WORLD</div><h1>Discover. Watch.<br /><span>Experience.</span></h1>
            <p className="sub">Welcome to TUBEXA — explore videos, discover new categories and enjoy your video experience in one place.</p>
            <button className="primary" onClick={() => { if (!user) { setPage("auth"); return; } setPage("upload"); setStatus(""); }}>Upload Video →</button>
            <div className="db-status">{databaseStatus}</div>
          </section>
          <section className="section">
            <h2 className="section-title">Explore Categories</h2>
            <div className="categories">{["All", "Gaming", "Music", "Sports", "Kids", "Education", "Entertainment"].map(item => <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 className="section-title">Discover Videos</h2>
              <label className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Sort:
                <select value={sortBy} onChange={event => setSortBy(event.target.value)} aria-label="Sort videos" style={{ background: "#17171d", color: "#fff", border: "1px solid #39343d", borderRadius: 10, padding: "9px 12px" }}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="views">Most views</option>
                </select>
              </label>
            </div>
            {loadingVideos ? <p className="muted">Loading videos...</p> : filteredVideos.length === 0 ? <div className="notice">{search ? "No videos found. Try another video name." : "No videos available yet."}</div> : (
              <div className="grid">
                {filteredVideos.map(video => {
                  return <article className="card" key={video.id}>
                    {playingVideo === video.id && videoUrls[video.id] ? <video className="video-preview" src={videoUrls[video.id]} controls playsInline onPlay={() => { void recordVideoView(video.id); }} /> : <div className="thumb" style={{ background: "#29202c" }}>▶️</div>}
                    <div className="card-info">
                      <h3>{video.title}</h3><div className="muted">Views: {videoViewCounts[video.id] ?? 0} · Unique signed-in viewers</div>
                      <div className="muted">{video.file_size ? (video.file_size / (1024 * 1024)).toFixed(1) + " MB" : ""}</div>
                      <button className="profile-link" style={{ marginTop: 10 }} onClick={() => openProfile(video.owner_id)}>View Creator Channel</button>
                      <div className="video-actions"><button className="primary" disabled={!videoUrls[video.id]} onClick={() => { setPlayingVideo(playingVideo === video.id ? null : video.id); setSettingsVideo(null); }}>{playingVideo === video.id ? "Close Player" : "Play"}</button><button className="profile-link" onClick={() => toggleVideoLike(video.id)} disabled={likeLoading === video.id}>{likeLoading === video.id ? "Please wait..." : likedVideos.includes(video.id) ? "♥ Liked" : "♡ Like"}</button><button className="profile-link" onClick={() => toggleVideoSave(video.id)} disabled={saveLoading === video.id}>{saveLoading === video.id ? "Please wait..." : savedVideoIds.includes(video.id) ? "✓ Saved" : "＋ Save"}</button></div>
                    </div>
                    {renderVideoComments(video.id)}
                  </article>;
                })}
              </div>
            )}
            <h2 className="section-title" style={{ marginTop: 35 }}>My Uploaded Videos</h2>
            {!user ? <div className="notice">Log in to see and manage your own uploaded videos.</div> : loadingVideos ? <p className="muted">Loading your videos...</p> : myUploadedVideos.length === 0 ? <p className="muted">{search ? "No matching videos in your uploads." : "You have not uploaded any videos yet."}</p> : (
              <div className="grid">
                {myUploadedVideos.map(video => <article className="card" key={video.id}>
                  {playingVideo === video.id && videoUrls[video.id] ? <>
                    <video className="video-preview" src={videoUrls[video.id]} controls playsInline onPlay={() => { void recordVideoView(video.id); }} />
                    <div className="settings-wrap"><button className="settings-button" onClick={() => setSettingsVideo(settingsVideo === video.id ? null : video.id)}>⚙️ Settings</button>
                      {settingsVideo === video.id && <div className="settings-panel"><strong>Audio & Language</strong><label>Audio Track</label><select value={audioMode} onChange={e => setAudioMode(e.target.value)}><option>Original Audio</option><option>AI Dubbing</option></select>
                        {audioMode === "AI Dubbing" && <><label>Dubbing Language</label><select value={dubLanguage} onChange={e => setDubLanguage(e.target.value)}>{languages.map(language => <option key={language}>{language}</option>)}</select><div className="settings-note">AI dubbing engine is not connected yet. Your language preference is selected, but the video's voice will not change until processing is implemented.</div></>}
                      </div>}
                    </div>
                  </> : <div className="thumb" style={{ background: "#29202c" }}>▶️</div>}
                  <div className="card-info"><h3>{video.title}</h3><div className="muted">Views: {videoViewCounts[video.id] ?? 0} · Unique signed-in viewers</div><div className="muted">{video.file_size ? (video.file_size / (1024 * 1024)).toFixed(1) + " MB" : ""}</div>
                    <div className="video-actions"><button className="primary" disabled={!videoUrls[video.id]} onClick={() => { setPlayingVideo(playingVideo === video.id ? null : video.id); setSettingsVideo(null); }}>{playingVideo === video.id ? "Close Player" : "Play"}</button><button className="profile-link" onClick={() => toggleVideoLike(video.id)} disabled={likeLoading === video.id}>{likeLoading === video.id ? "Please wait..." : likedVideos.includes(video.id) ? "♥ Liked" : "♡ Like"}</button><button className="profile-link" onClick={() => toggleVideoSave(video.id)} disabled={saveLoading === video.id}>{saveLoading === video.id ? "Please wait..." : savedVideoIds.includes(video.id) ? "✓ Saved" : "＋ Save"}</button><button className="danger" onClick={() => deleteVideo(video)}>Delete</button></div>
                  </div>
                  {renderVideoComments(video.id)}
                </article>)}
              </div>
            )}
            {status && <div className="message">{status}</div>}
            {user && (
              <>
                <h2 className="section-title" style={{ marginTop: 35 }}>Watch Later</h2>
                {savedVideos.length === 0 ? <p className="muted">You have not saved any videos yet.</p> : (
                  <div className="grid">
                    {savedVideos.map(video => (
                      <article className="card" key={video.id}>
                        {playingVideo === video.id && videoUrls[video.id] ? <video className="video-preview" src={videoUrls[video.id]} controls playsInline onPlay={() => { void recordVideoView(video.id); }} /> : <div className="thumb">▶️</div>}
                        <div className="card-info">
                          <h3>{video.title}</h3><div className="muted">Views: {videoViewCounts[video.id] ?? 0} · Unique signed-in viewers</div>
                          <button className="primary" disabled={!videoUrls[video.id]} onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}>{playingVideo === video.id ? "Close Player" : "Play"}</button>
                          <button className="profile-link" style={{ marginTop: 10 }} onClick={() => toggleVideoSave(video.id)} disabled={saveLoading === video.id}>Remove from Watch Later</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {user && (
              <section style={{ marginTop: 35 }}>
                <h2 className="section-title">My Playlists</h2>
                <form onSubmit={createPlaylist} className="panel" style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                  <input value={playlistName} onChange={event => setPlaylistName(event.target.value)} maxLength={80} placeholder="Playlist name (e.g. My Favorites)" aria-label="Playlist name" required />
                  <input value={playlistDescription} onChange={event => setPlaylistDescription(event.target.value)} maxLength={300} placeholder="Short description (optional)" aria-label="Playlist description" />
                  <label style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <input type="checkbox" checked={playlistIsPublic} onChange={event => setPlaylistIsPublic(event.target.checked)} />
                    Make this playlist public
                  </label>
                  <button className="primary" type="submit" disabled={playlistSavingId === "create"}>{playlistSavingId === "create" ? "Creating..." : "＋ Create Playlist"}</button>
                </form>
                {playlistMessage && <div className="message">{playlistMessage}</div>}
                {playlistLoading ? <p className="muted">Loading playlists...</p> : playlists.length === 0 ? (
                  <div className="notice">You have not created a playlist yet. Create one above, then add videos from the video cards.</div>
                ) : (
                  <div className="grid">
                    {playlists.map(playlist => {
                      const items = playlistItems.filter(item => item.playlist_id === playlist.id);
                      return (
                        <article className="card" key={playlist.id}>
                          <div className="card-info">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <h3>{playlist.name}</h3>
                              <span className="muted">{playlist.is_public ? "Public" : "Private"}</span>
                            </div>
                            {playlist.description && <p className="muted">{playlist.description}</p>}
                            <div className="muted">{items.length} video{items.length === 1 ? "" : "s"}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                              <button className="profile-link" onClick={() => togglePlaylistVisibility(playlist)} disabled={playlistSavingId === playlist.id}>{playlist.is_public ? "Make Private" : "Make Public"}</button>
                              <button className="danger" onClick={() => deletePlaylist(playlist.id)} disabled={playlistSavingId === playlist.id}>Delete Playlist</button>
                            </div>
                            {items.length === 0 ? <p className="muted">No videos in this playlist yet.</p> : (
                              <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
                                {items.map(item => {
                                  const video = myVideos.find(entry => entry.id === item.video_id);
                                  return (
                                    <div key={item.video_id} style={{ display: "grid", gap: 8, borderTop: "1px solid #39343d", paddingTop: 9 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <span>{video?.title || "Video unavailable"}</span>
                                        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                                          {video && videoUrls[video.id] && <button className="primary" onClick={() => { setPlayingVideo(playingVideo === video.id ? null : video.id); setSettingsVideo(null); }}>{playingVideo === video.id ? "Close Player" : "Play"}</button>}
                                          <button className="comment-delete" onClick={() => removeVideoFromPlaylist(playlist.id, item.video_id)} disabled={playlistSavingId === playlist.id + ":" + item.video_id}>Remove</button>
                                        </div>
                                      </div>
                                      {video && videoUrls[video.id] && playingVideo === video.id && <video className="video-preview" src={videoUrls[video.id]} controls playsInline onPlay={() => { void recordVideoView(video.id); }} />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section style={{ marginTop: 38 }}>
              <h2 className="section-title">Explore Public Playlists</h2>
              <p className="muted">Discover playlists that creators have chosen to share with everyone.</p>
              {publicPlaylistsLoading ? <p className="muted">Loading public playlists...</p> : publicPlaylists.length === 0 ? (
                <div className="notice">No public playlists have been shared yet.</div>
              ) : (
                <div className="grid">
                  {publicPlaylists.map(playlist => {
                    const items = publicPlaylistItems.filter(item => item.playlist_id === playlist.id);
                    const expanded = openPublicPlaylistId === playlist.id;
                    return (
                      <article className="card" key={playlist.id}>
                        <div className="card-info">
                          <h3>{playlist.name}</h3>
                          {(() => {
                            const creator = publicPlaylistOwners.find(owner => owner.id === playlist.owner_id);
                            return creator ? <button className="profile-link" onClick={() => openProfile(creator.id)}>By {creator.display_name || creator.username}</button> : null;
                          })()}
                          {playlist.description && <p className="muted">{playlist.description}</p>}
                          <div className="muted">{items.length} video{items.length === 1 ? "" : "s"} · Public playlist</div>
                          <button className="profile-link" style={{ marginTop: 10 }} onClick={() => setOpenPublicPlaylistId(expanded ? null : playlist.id)}>
                            {expanded ? "Hide Videos" : "View Playlist"}
                          </button>
                          {expanded && (
                            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                              {items.length === 0 ? <p className="muted">This playlist is currently empty.</p> : items.map(item => {
                                const video = publicPlaylistVideos.find(entry => entry.id === item.video_id);
                                const videoUrl = publicPlaylistVideoUrls[item.video_id];
                                return (
                                  <div key={item.video_id} style={{ display: "grid", gap: 8, borderTop: "1px solid #39343d", paddingTop: 9 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                      <span>{video?.title || "Video unavailable"}</span>
                                      {video && videoUrl ? (
                                        <button className="primary" onClick={() => { setPlayingVideo(playingVideo === video.id ? null : video.id); setSettingsVideo(null); }}>
                                          {playingVideo === video.id ? "Close Player" : "Play"}
                                        </button>
                                      ) : <span className="muted">Unavailable</span>}
                                    </div>
                                    {video && videoUrl && playingVideo === video.id && (
                                      <video className="video-preview" src={videoUrl} controls playsInline onPlay={() => { void recordVideoView(video.id); }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
          <section className="section">
            <h2 className="section-title">Watch a YouTube Video</h2><div className="panel"><div className="player">{videoId ? <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="TUBEXA video player" allowFullScreen /> : <div><div style={{ fontSize: 45, color: "#ff3155" }}>▶</div>Enter a YouTube video URL</div>}</div>
              <div className="urlrow"><input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube video link..." /><button className="primary" onClick={playVideo}>Play Video</button></div>
              <div className="notice">YouTube's embedded player controls audio tracks managed by YouTube. TUBEXA cannot add its own AI audio track to an embedded YouTube video.</div>
              {status && <div className="message">{status}</div>}
            </div>
          </section>
        </main>
      ) : (
        <main>
          <section className="hero"><div className="tag">TUBEXA VIDEO STUDIO</div><h1>Upload<br /><span>Your Video</span></h1><p className="sub">Upload your video securely to your TUBEXA account.</p></section>
          <section className="section"><div className="panel"><h2 className="section-title">Upload Your Video</h2>
            {!user && <div className="notice">Please log in before uploading videos.</div>}
            <div className="upload"><div style={{ fontSize: 42 }}>📁</div><h3>Select Your Video</h3><p className="muted">MP4, WebM or MOV · Maximum 50 MB</p><div className="field"><label htmlFor="video-category">Video Category</label><select id="video-category" value={uploadCategory} onChange={event => setUploadCategory(event.target.value)} disabled={!user || uploading}>{["Gaming", "Music", "Sports", "Kids", "Education", "Entertainment"].map(item => <option key={item} value={item}>{item}</option>)}</select></div><input id="video-upload" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={selectFile} disabled={!user || uploading} />{videoFile && <p style={{ color: "#72e0ad", overflowWrap: "anywhere" }}>Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</p>}</div>
            <button className="primary" style={{ width: "100%", marginTop: 20 }} onClick={uploadVideo} disabled={!user || !videoFile || uploading}>{uploading ? "Uploading..." : "Upload Video"}</button>{status && <div className="message">{status}</div>}
          </div></section>
        </main>
      )}
      <footer>© 2026 TUBEXA · Your Video World</footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
