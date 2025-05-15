/* File: src/app/onboarding/privacy/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Everything you say stays on your device.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>I don’t store anything. Ever.</p>
            <Button size="lg" onClick={() => router.push('/onboarding/choose-mode')}>
              Okay, I’m in
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
