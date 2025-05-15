/* File: src/app/onboarding/talk/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const prompts = [
  "I’m not sure what I want to say, but I need to say something.",
  "This day has been heavier than usual…",
  "Can I just get something off my chest?",
];

export default function TalkPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setThreadId(sessionStorage.getItem('threadId'));
    }
  }, []);

  const completeOnboarding = async () => {
    if (!threadId) {
      console.error('Missing threadId');
      return;
    }

    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          completeOnboarding: true,
        }),
      });
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="max-w-md mx-auto space-y-4">
          <CardHeader>
            <CardTitle>
              Cool. Start however you like—big thoughts, little moments, or just a feeling.
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {prompts.map((text) => (
              <motion.div
                key={text}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selected === text ? 'bg-primary text-white' : 'bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(text)}
              >
                {text}
              </motion.div>
            ))}
          </CardContent>
          <CardContent>
            <Button size="lg" disabled={!selected} onClick={completeOnboarding}>
              Got it, I’m ready
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
