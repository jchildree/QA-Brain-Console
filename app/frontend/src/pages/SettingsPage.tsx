import { useState, useEffect } from 'react';
import { useTheme, type Theme, type FontSize, type Contrast } from '../context/ThemeContext';
import { ChatScopePicker } from '../components/ChatScopePicker';
import { subscribeToPush, testPush } from '../api/client';

const selectClasses = 'text-sm px-3 py-1.5 rounded-lg focus:outline-none font-mono border';
const selectStyle = { background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' };

const PUSH_SUBSCRIPTION_KEY = 'push-subscription';

export function SettingsPage() {
  const { theme, fontSize, contrast, reduceMotion, setTheme, setFontSize, setContrast, setReduceMotion } = useTheme();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const notificationsSupported = 'Notification' in window && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!notificationsSupported) return;
    setNotificationPermission(Notification.permission);
    if (Notification.permission === 'granted' && localStorage.getItem(PUSH_SUBSCRIPTION_KEY)) {
      setIsSubscribed(true);
    }
  }, [notificationsSupported]);

  const handleRequestPermission = async () => {
    if (!notificationsSupported) {
      setPushMessage({ type: 'error', text: 'Notifications not supported in this browser' });
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true });
        const result = await subscribeToPush(subscription);

        if (result.ok) {
          localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription.toJSON()));
          setIsSubscribed(true);
          setPushMessage({ type: 'success', text: 'Subscribed to push notifications' });
        } else {
          setPushMessage({ type: 'error', text: result.error || 'Failed to sync subscription with backend' });
        }
      } else if (permission === 'denied') {
        setPushMessage({ type: 'error', text: 'Notifications were denied. Change browser settings to re-enable.' });
      }
    } catch (err) {
      setPushMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    try {
      const result = await testPush();
      setPushMessage(
        result.ok
          ? { type: 'success', text: 'Test notification sent! Check your system notifications.' }
          : { type: 'error', text: result.error || 'Failed to send test notification' }
      );
    } catch (err) {
      setPushMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="chart-title">Settings</h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Theme</span>
        <select
          aria-label="Theme"
          className={selectClasses}
          style={selectStyle}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Console Font Size</span>
        <select
          aria-label="Console Font Size"
          className={selectClasses}
          style={selectStyle}
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value as FontSize)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">Extra Large</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Contrast</span>
        <select
          aria-label="Contrast"
          className={selectClasses}
          style={selectStyle}
          value={contrast}
          onChange={(e) => setContrast(e.target.value as Contrast)}
        >
          <option value="normal">Normal</option>
          <option value="high">High Contrast</option>
        </select>
      </label>

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          aria-label="Reduce Motion"
          checked={reduceMotion}
          onChange={(e) => setReduceMotion(e.target.checked)}
        />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Reduce Motion</span>
      </label>

      <ChatScopePicker />

      <div className="border-t" style={{ borderColor: 'var(--rule)', paddingTop: '1.5rem' }}>
        <h2 className="chart-title text-sm mb-4">Notifications</h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
              Permission Status
            </span>
            <span className="text-sm" style={{ color: 'var(--ink)' }}>
              {notificationPermission === 'granted' ? '✓ Granted' : notificationPermission === 'denied' ? '✗ Denied' : '◆ Default'}
            </span>
          </div>

          <button
            onClick={handleRequestPermission}
            disabled={notificationPermission !== 'default' || pushLoading || !notificationsSupported}
            className="px-3 py-2 rounded-lg text-sm font-mono font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: notificationPermission === 'default' ? 'var(--highlight)' : 'var(--paper-2)',
              color: 'var(--ink)',
              border: '1px solid var(--rule)',
            }}
          >
            {pushLoading ? 'Requesting...' : 'Request Permission'}
          </button>

          {isSubscribed && (
            <>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
                ✓ Subscribed to push
              </span>

              <button
                onClick={handleTestPush}
                disabled={pushLoading}
                className="px-3 py-2 rounded-lg text-sm font-mono font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--paper-2)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
              >
                {pushLoading ? 'Sending...' : 'Send Test Push'}
              </button>
            </>
          )}

          {pushMessage && (
            <div
              className="p-2 rounded-lg text-sm"
              style={{
                background: 'var(--paper-2)',
                color: pushMessage.type === 'success' ? '#22c55e' : '#ef4444',
                border: `1px solid ${pushMessage.type === 'success' ? '#22c55e40' : '#ef444440'}`,
              }}
            >
              {pushMessage.text}
            </div>
          )}

          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
            Push notifications allow the app to alert you about important events, even when not in focus.
          </p>
        </div>
      </div>

      <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
        Preferences save to this browser. Additional theme palettes can be added later.
      </p>
    </div>
  );
}
