import React, { useEffect, useRef } from 'react';
import { useTheme } from './theme';

export function SeamlessVideo({
  className = '',
  lightSrc = '/Light.mp4',
  darkSrc = '/Dark.mp4',
}) {
  const { theme } = useTheme();
  const lightRef = useRef(null);
  const darkRef = useRef(null);
  const prevTheme = useRef(theme);

  // Ensure both videos are playing at all times so the crossfade is instant
  useEffect(() => {
    lightRef.current?.play().catch(() => {});
    darkRef.current?.play().catch(() => {});
  }, []);

  // Sync playback time on theme switch so the crossfade is frame-accurate
  useEffect(() => {
    if (prevTheme.current === theme) return;
    prevTheme.current = theme;
    if (theme === 'light' && darkRef.current && lightRef.current) {
      lightRef.current.currentTime = darkRef.current.currentTime;
    } else if (theme === 'dark' && lightRef.current && darkRef.current) {
      darkRef.current.currentTime = lightRef.current.currentTime;
    }
  }, [theme]);

  return (
    <div className={`seamless-video-wrap ${className}`} aria-hidden="true">
      <video
        ref={lightRef}
        src={lightSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el seamless-video-light ${theme === 'light' ? 'is-active' : ''}`}
      />
      <video
        ref={darkRef}
        src={darkSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el seamless-video-dark ${theme === 'dark' ? 'is-active' : ''}`}
      />
      <div className="seamless-video-fade" />
    </div>
  );
}
