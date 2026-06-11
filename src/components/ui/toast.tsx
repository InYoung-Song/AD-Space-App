import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cardShadow } from './card';
import { Txt } from './text';

type ToastType = 'error' | 'info' | 'success';

interface ToastOptions {
  type?: ToastType;
  /** Auto-dismiss delay in ms. */
  duration?: number;
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastApi {
  show: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

/**
 * App-wide, non-blocking notice surface. Used to "warn" after a silent retry is
 * exhausted (failed save, lost connection) without interrupting the user.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, opts?: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++counter.current;
    setToast({ id, message, type: opts?.type ?? 'info' });
    timer.current = setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, opts?.duration ?? 4500);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? <ToastBanner toast={toast} onDismiss={() => setToast(null)} /> : null}
    </ToastContext.Provider>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const accent = toast.type === 'error' ? t.danger : toast.type === 'success' ? t.success : t.accent;
  const icon =
    toast.type === 'error' ? 'alert-circle' : toast.type === 'success' ? 'checkmark-circle' : 'information-circle';

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + Spacing.xl }]}>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        style={[styles.toast, { backgroundColor: t.surfaceElevated, borderColor: t.border }, cardShadow]}>
        <Ionicons name={icon} size={18} color={accent} />
        <Txt variant="small" style={{ flex: 1 }}>
          {toast.message}
        </Txt>
        <Ionicons name="close" size={16} color={t.textMuted} />
      </Pressable>
    </View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 2000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 460,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
