import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { toast } from "sonner";
import { Bell, Star, CheckCircle, XCircle, Check, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/empty-state";
import { EmptyBellIllustration } from "../components/ui/illustrations";

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  listingId: number | null;
  createdAt: string;
}

function notifIcon(type: string) {
  if (type === "new_review") return <Star className="h-4 w-4 text-amber-500" />;
  if (type === "business_approved") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  if (type === "business_rejected") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Bell className="h-4 w-4 text-primary" />;
}

function notifBg(type: string) {
  if (type === "new_review") return "bg-amber-50";
  if (type === "business_approved") return "bg-emerald-50";
  if (type === "business_rejected") return "bg-red-50";
  return "bg-blue-50";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "acum câteva secunde";
  if (mins < 60) return `acum ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `acum ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `acum ${days} ${days === 1 ? "zi" : "zile"}`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/notifications"),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      toast.success("Toate notificările marcate ca citite");
    },
  });

  const notifs: Notification[] = data?.notifications ?? [];
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notificări
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "Se încarcă..." : unreadCount > 0 ? `${unreadCount} necitite` : "Toate citite"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <CheckCheck className="h-4 w-4" /> Marchează toate
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-4 animate-pulse flex gap-3">
              <div className="w-9 h-9 bg-muted rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <EmptyState
          illustration={EmptyBellIllustration}
          title="Nicio notificare"
          description="Vei primi notificări când cineva îți lasă o recenzie sau când statusul firmei se schimbă."
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border transition-all ${n.isRead ? "border-border opacity-75" : "border-primary/20 shadow-sm"}`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`w-9 h-9 rounded-xl ${notifBg(n.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                  {notifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.isRead ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    {n.listingId && (
                      <Link
                        to={`/listing/${n.listingId}`}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Vezi anunțul →
                      </Link>
                    )}
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0"
                    title="Marchează ca citit"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
