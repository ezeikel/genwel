'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useTransition } from 'react';
import { updateUserName } from '@/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NamePrompt({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissalKey = `genwel:name-prompt-dismissed:${userId}`;

  useEffect(() => {
    if (!window.localStorage.getItem(dismissalKey)) setOpen(true);
  }, [dismissalKey]);

  function dismiss() {
    window.localStorage.setItem(dismissalKey, 'true');
    setOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateUserName(name);
      if ('error' in result && result.error) {
        setError(result.error);
        return;
      }

      window.localStorage.removeItem(dismissalKey);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismiss();
        else setOpen(true);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl outline-none">
          <Dialog.Title className="text-xl font-bold text-foreground">
            What should we call you?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            Add your name to make your Genwel account feel more personal.
          </Dialog.Description>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Your name</Label>
              <Input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                autoFocus
                maxLength={80}
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'profile-name-error' : undefined}
                disabled={isPending}
              />
              {error && (
                <p id="profile-name-error" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={dismiss}
                disabled={isPending}
              >
                Not now
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Saving…' : 'Save name'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
