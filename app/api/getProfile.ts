import { NextApiRequest, NextApiResponse } from 'next';
import { getUserProfile } from '@/lib/sessionMemory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { threadId } = req.query;

  if (!threadId || typeof threadId !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid threadId' });
  }

  try {
    const profile = getUserProfile(threadId);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
