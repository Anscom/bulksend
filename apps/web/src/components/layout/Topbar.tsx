import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  listNotifications,
  markAllRead,
  deleteNotification,
  type Notification,
} from '../../lib/api/notifications';

interface TopbarProps {
  crumb: string;
  title: string;
  onMenuOpen?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({ crumb, title, onMenuOpen, actions }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await listNotifications();
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      // silently ignore — notifications are non-critical
    }
  }, []);

  // Poll for unread count every 30 seconds and on window focus
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnread((prev) => {
      const deleted = notifications.find((n) => n.id === id);
      return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const typeIcon = (type: string) => {
    if (type === 'campaign_sent') return '✓';
    if (type === 'campaign_failed') return '!';
    if (type === 'campaign_scheduled') return '◷';
    return '•';
  };

  const typeColor = (type: string) => {
    if (type === 'campaign_sent') return 'var(--green)';
    if (type === 'campaign_failed') return 'var(--red)';
    if (type === 'campaign_scheduled') return 'var(--indigo)';
    return 'var(--slate)';
  };

  return (
    <header className="topbar">
      <button className="icon-btn mobile-only" onClick={onMenuOpen} aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>

      <div className="tb-title">
        <span className="tb-crumb">{crumb}</span>
        <h1>{title}</h1>
      </div>

      <div className="tb-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input type="text" placeholder="Search…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="tb-actions">
        {actions}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={toggleOpen} aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unread > 0 && <span className="dot" />}
          </button>

          {open && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unread > 0 && (
                  <button className="notif-mark-read" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                      <span
                        className="notif-icon"
                        style={{ background: typeColor(n.type) + '20', color: typeColor(n.type) }}
                      >
                        {typeIcon(n.type)}
                      </span>
                      <div className="notif-content">
                        <p className="notif-item-title">{n.title}</p>
                        <p className="notif-item-body">{n.body}</p>
                        <span className="notif-time">
                          {new Date(n.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <button
                        className="notif-delete"
                        onClick={(e) => handleDelete(n.id, e)}
                        aria-label="Dismiss"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
