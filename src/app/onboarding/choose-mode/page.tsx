/* File: src/app/onboarding/choose-mode/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ChooseModePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md mx-auto space-y-6">
          <CardHeader>
            <CardTitle>Let’s start in a way that feels right for you</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button size="lg" onClick={() => router.push('/onboarding/talk')}>
              💬 I just want to talk
            </Button>
            <Button size="lg" onClick={() => router.push('/onboarding/talk')}>
              🧠 I need to sort through some feelings
            </Button>
            <Button size="lg" onClick={() => router.push('/onboarding/talk')}>
              👀 I’m just checking this out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
