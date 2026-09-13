import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, Trophy, Target, ListChecks, Flame, Sunrise, Moon, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { notificationsApi } from "../../api/endpoints/insights";
import { useUiStore } from "../../stores/uiStore";
import { useClickOutside } from "../../hooks/useClickOutside";
import "./NotificationsBell.css";

const ICONS: Record<string, typeof Bell> = {
  morning_reminder: Sunrise,
  habit_reminder: ListChecks,
  task_reminder: ListChecks,
  nightly_review: Moon,
  streak_risk: Flame,
  goal_reminder: Target,
  achievement_unlocked: Trophy,
  weekly_report: Info,
  system: Info,
};

export default function NotificationsBell() {
  const open = useUiStore((s) => s.notificationsOpen);
  const setOpen = useUiStore((s) => s.setNotificationsOpen);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list({ limit: 15 }),
    refetchInterval: 60_000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="btn btn-icon notif-bell" onClick={() => setOpen(!open)} type="button" aria-label="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="notif-panel-header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button className="btn-ghost btn-sm" onClick={() => markAllRead.mutate()} type="button">
                  Mark all read
                </button>
              )}
            </div>
            <div className="notif-list">
              {!data?.items.length && <div className="notif-empty">You're all caught up.</div>}
              {data?.items.map((n) => {
                const Icon = ICONS[n.type] ?? Info;
                return (
                  <button
                    key={n._id}
                    className={"notif-item" + (n.readAt ? "" : " unread")}
                    onClick={() => !n.readAt && markRead.mutate(n._id)}
                    type="button"
                  >
                    <span className="notif-icon">
                      <Icon size={15} />
                    </span>
                    <span className="notif-body">
                      <strong>{n.title}</strong>
                      <span>{n.body}</span>
                      <time>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</time>
                    </span>
                    {!n.readAt && <Check size={14} className="notif-check" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
