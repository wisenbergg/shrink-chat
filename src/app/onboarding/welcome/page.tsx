/* File: src/app/onboarding/welcome/page.tsx */
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('threadId')) {
      sessionStorage.setItem('threadId', uuid());
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Hey. I&apos;m really glad you&apos;re here.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
            This space is just for you — to say what you&rsquo;re feeling, without pressure or judgment.<br/>
            I&apos;m here to listen, no matter what&rsquo;s on your mind.
            </p>
            <Button size="lg" onClick={() => router.push('/onboarding/privacy')}>
              Next
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}