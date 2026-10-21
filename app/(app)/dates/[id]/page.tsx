import { DeleteDateButton } from "@/components/features/delete-date-button";
import { ImageGallery } from "@/components/features/image-gallery";
import { BackButton } from "@/components/ui/back-button";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DateEntry } from "@/types";
import {
  Calendar,
  Edit3,
  MapPin,
  Music,
  Coins,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface DateDetailPageProps {
  params: Promise<{ id: string }>;
}

const MOOD_MAP: Record<string, { label: string; emoji: string }> = {
  love: { label: "Yêu", emoji: "❤️" },
  happy: { label: "Vui", emoji: "😊" },
  calm: { label: "Bình yên", emoji: "🌿" },
  excited: { label: "Hào hứng", emoji: "✨" },
  tired: { label: "Mệt", emoji: "🥱" },
  sad: { label: "Buồn", emoji: "🥺" },
};

export default async function DateDetailPage(props: DateDetailPageProps) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient(user);

  const { data: date, error } = await supabase
    .from("dates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !date) notFound();

  const entry = date as DateEntry;

  const { data: mediaList } = await supabase
    .from("date_media")
    .select("*")
    .eq("date_id", id)
    .order("position", { ascending: true });

  const { data: placesList } = await supabase
    .from("date_places")
    .select("*")
    .eq("date_id", id)
    .order("position", { ascending: true });

  let formattedDate = "";
  if (entry.date_time) {
    const start = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(entry.date_time));
    if (entry.end_date) {
      const end = new Intl.DateTimeFormat("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(entry.end_date));
      formattedDate = `${start} - ${end}`;
    } else {
      formattedDate = start;
    }
  } else {
    formattedDate = new Intl.DateTimeFormat("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(entry.created_at));
  }

  const imageUrls = entry.checkin_image_urls?.length
    ? entry.checkin_image_urls
    : entry.checkin_image_url
      ? [entry.checkin_image_url]
      : [];

  const galleryItems =
    mediaList && mediaList.length > 0
      ? mediaList.map((m) => ({
          id: m.id,
          kind: m.kind as "image" | "video",
          alt: entry.title || entry.location_name || "Kỷ niệm",
        }))
      : imageUrls.map((url) => ({
          url,
          kind: (/\.(mp4|mov|webm)$/i.test(url) ? "video" : "image") as
            | "image"
            | "video",
          alt: entry.title || entry.location_name || "Kỷ niệm",
        }));

  const moodInfo = entry.mood ? MOOD_MAP[entry.mood] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BackButton fallback="/dates" forceFallback />
        <div className="flex items-center gap-2">
          <DeleteDateButton id={entry.id} coupleId={entry.couple_id} />
          <Link
            href={`/dates/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-primary text-primary-fg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Edit3 size={15} /> Sửa
          </Link>
        </div>
      </div>

      {/* Hero Media / Gallery */}
      <ImageGallery items={galleryItems} />

      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {moodInfo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span>{moodInfo.emoji}</span>
              <span>{moodInfo.label}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar size={13} /> {formattedDate}
          </span>

          {entry.rating && (
            <div className="flex items-center gap-0.5 ml-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < entry.rating!
                      ? "text-primary"
                      : "text-text-muted opacity-30"
                  }`}
                >
                  ♥
                </span>
              ))}
            </div>
          )}
        </div>

        <h1 className="font-heading text-2xl md:text-3xl font-bold text-text">
          {entry.title || entry.location_name || "Buổi hẹn hò"}
        </h1>

        {entry.note && (
          <p className="text-text text-base whitespace-pre-wrap leading-relaxed bg-surface p-4 rounded-[var(--radius-lg)] border border-border">
            💭 {entry.note}
          </p>
        )}
      </div>

      {/* Meta Grid: Places, Spend, Song, Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Places */}
        {placesList && placesList.length > 0 ? (
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <MapPin size={14} className="text-primary" />
              <span>Địa điểm ({placesList.length})</span>
            </div>
            <div className="space-y-1">
              {placesList.map((p, idx) => (
                <p key={p.id} className="text-xs text-text truncate">
                  {idx + 1}. {p.name}
                </p>
              ))}
            </div>
          </div>
        ) : entry.location_name ? (
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <MapPin size={14} className="text-primary" />
              <span>Địa điểm</span>
            </div>
            <p className="text-xs text-text truncate">{entry.location_name}</p>
          </div>
        ) : null}

        {/* Spend */}
        {entry.spend_vnd ? (
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <Coins size={14} className="text-primary" />
              <span>Chi tiêu</span>
            </div>
            <p className="text-xs text-text font-medium">
              {new Intl.NumberFormat("vi-VN").format(entry.spend_vnd)} đ
              {entry.paid_split
                ? " · Chia đôi"
                : entry.paid_by === "partner"
                  ? " · Người ấy trả"
                  : entry.paid_by === "me"
                    ? " · Tôi trả"
                    : ""}
            </p>
          </div>
        ) : null}

        {/* Song */}
        {entry.song ? (
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <Music size={14} className="text-primary" />
              <span>Bài hát cùng nghe</span>
            </div>
            <p className="text-xs text-text truncate">🎵 {entry.song}</p>
          </div>
        ) : null}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 ? (
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-surface border border-border space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <Tag size={14} className="text-primary" />
              <span>Thẻ gắn</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Review details: Pros, Cons, Wish */}
      <div className="space-y-4">
        {entry.pros && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-primary/5 border border-primary/20">
            <h2 className="font-semibold text-text text-sm mb-1.5 flex items-center gap-2">
              <span className="text-base">📝</span> Ghi chú thêm
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap leading-relaxed">{entry.pros}</p>
          </div>
        )}

        {entry.cons && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20">
            <h2 className="font-semibold text-text text-sm mb-1.5 flex items-center gap-2">
              <span className="text-base">🔧</span> Cần cải thiện
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap">{entry.cons}</p>
          </div>
        )}

        {entry.wish_next_time && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-primary/5 border border-primary/20">
            <h2 className="font-semibold text-text text-sm mb-1.5 flex items-center gap-2">
              <span className="text-base">💭</span> Muốn thử lần sau
            </h2>
            <p className="text-text text-sm whitespace-pre-wrap">
              {entry.wish_next_time}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
