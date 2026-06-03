import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Radius } from '@/constants/theme';
import type { Listing } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/store';
import { Button } from './ui/button';
import { Txt } from './ui/text';

interface Props {
  listing?: Listing;
  weeks?: number;
  units?: number;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function RequestInfoForm({ listing, weeks, units }: Props) {
  const t = useTheme();
  const addRequest = useAppStore((s) => s.addRequest);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim().length > 1 && EMAIL_RE.test(email.trim());

  function submit() {
    addRequest({
      listingId: listing?.id,
      listingTitle: listing?.title,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      weeks,
      units,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.success, { backgroundColor: t.surfaceSelected, borderColor: t.border }]}>
        <View style={[styles.check, { backgroundColor: t.success }]}>
          <Ionicons name="checkmark" size={26} color="#fff" />
        </View>
        <Txt variant="subtitle" center>
          We&apos;ve noted your interest
        </Txt>
        <Txt variant="small" muted center>
          Saved on this device. No payment, booking, or contact has been made — this app only helps
          you plan. Reach out to the media owner directly to book.
        </Txt>
        <Button
          title="Send another"
          variant="ghost"
          size="sm"
          onPress={() => {
            setSubmitted(false);
            setMessage('');
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <Field label="Your name">
        <Input value={name} onChangeText={setName} placeholder="Jane Doe" />
      </Field>
      <Field label="Email">
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>
      <Field label="Message (optional)">
        <Input
          value={message}
          onChangeText={setMessage}
          placeholder="What are you hoping to advertise?"
          multiline
        />
      </Field>
      <Button title="Save my interest" icon="bookmark-outline" onPress={submit} disabled={!canSubmit} fullWidth />
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label" muted>
        {label.toUpperCase()}
      </Txt>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textMuted}
      {...props}
      style={[
        styles.input,
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          color: t.text,
          height: props.multiline ? 88 : 46,
          textAlignVertical: props.multiline ? 'top' : 'center',
        },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  success: {
    alignItems: 'center',
    gap: 10,
    padding: 20,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
