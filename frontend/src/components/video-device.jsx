import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from './theme-context';

const blendDurationMs = 1200;

function playVideo(video) {
  video?.play().catch(() => {});
}

function syncTime(target, source) {
  if (!target || !source) return;

  const sync = () => {
    if (!Number.isFinite(source.currentTime)) return;
    if (Math.abs(target.currentTime - source.currentTime) > 0.035) {
      target.currentTime = source.currentTime;
    }
  };

  if (target.readyState > 0) {
    sync();
    return;
  }

  target.addEventListener('loadedmetadata', sync, { once: true });
}

export function SeamlessVideo({
  className = '',
  lightSrc = '/Light.mp4',
  darkSrc = '/Dark.mp4',
}) {
  const { theme } = useTheme();
  const lightRef = useRef(null);
  const darkRef = useRef(null);
  const blendTimerRef = useRef(null);
  const [visibleTheme, setVisibleTheme] = useState(theme);
  const [leavingTheme, setLeavingTheme] = useState(null);

  // Ensure both videos are playing at all times so the crossfade is instant
  useEffect(() => {
    playVideo(lightRef.current);
    playVideo(darkRef.current);
  }, []);

  // Keep the inactive video closely synced so toggles do not reveal drift.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const active = visibleTheme === 'light' ? lightRef.current : darkRef.current;
      const inactive = visibleTheme === 'light' ? darkRef.current : lightRef.current;
      syncTime(inactive, active);
      playVideo(active);
      playVideo(inactive);
    }, 700);

    return () => window.clearInterval(intervalId);
  }, [visibleTheme]);

  // Sync playback time on theme switch, then crossfade instead of swapping abruptly.
  useEffect(() => {
    if (visibleTheme === theme) return undefined;

    const outgoing = visibleTheme === 'light' ? lightRef.current : darkRef.current;
    const incoming = theme === 'light' ? lightRef.current : darkRef.current;

    window.clearTimeout(blendTimerRef.current);
    syncTime(incoming, outgoing);
    playVideo(outgoing);
    playVideo(incoming);

    const frameId = window.requestAnimationFrame(() => {
      setLeavingTheme(visibleTheme);
      setVisibleTheme(theme);

      blendTimerRef.current = window.setTimeout(() => {
        setLeavingTheme(null);
      }, blendDurationMs);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(blendTimerRef.current);
    };
  }, [theme, visibleTheme]);

  const lightState = [
    visibleTheme === 'light' ? 'is-active' : '',
    leavingTheme === 'light' ? 'is-leaving' : '',
  ].filter(Boolean).join(' ');
  const darkState = [
    visibleTheme === 'dark' ? 'is-active' : '',
    leavingTheme === 'dark' ? 'is-leaving' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`seamless-video-wrap ${leavingTheme ? 'is-blending' : ''} ${className}`.trim()} aria-hidden="true">
      <video
        ref={lightRef}
        src={lightSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el seamless-video-light ${lightState}`.trim()}
      />
      <video
        ref={darkRef}
        src={darkSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={`seamless-video-el seamless-video-dark ${darkState}`.trim()}
      />
      <div className="seamless-video-fade" />
    </div>
  );
}
