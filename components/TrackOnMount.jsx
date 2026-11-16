'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export default function TrackOnMount({ name, params }) {
  const key = JSON.stringify(params);
  useEffect(() => {
    track(name, JSON.parse(key));
  }, [name, key]);
  return null;
}
