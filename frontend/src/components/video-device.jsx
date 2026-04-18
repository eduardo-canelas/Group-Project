import React, { useEffect, useRef } from 'react';
import { useTheme } from './theme';

export function SeamlessVideo({ className = '' }) {
  const { theme } = useTheme();
  const lightRef = useRef(null);
  const darkRef = useRef(null);

  // Ensure both videos are playing at all times so the crossfade is instant
  useEffect(() => {
    lightRef.current?.play().catch(() => {});
    darkRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className={`seamless-video-wrap ${className}`} aria-hidden="true">
      <video
        ref={lightRef}
        src="/Light.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el seamless-video-light ${theme === 'light' ? 'is-active' : ''}`}
      />
      <video
        ref={darkRef}
        src="/Dark.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el ${theme === 'dark' ? 'is-active' : ''}`}
      />
      <div className="seamless-video-fade" />
    </div>
  );
}
