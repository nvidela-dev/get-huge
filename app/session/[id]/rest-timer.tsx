"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Translations } from "@/lib/translations";

interface RestTimerProps {
  defaultSeconds: number;
  translations: Translations;
}

export function RestTimer({ defaultSeconds, translations: t }: RestTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(defaultSeconds);
  const [hasFinished, setHasFinished] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update default seconds when prop changes
  useEffect(() => {
    if (!isRunning) {
      setSecondsRemaining(defaultSeconds);
    }
  }, [defaultSeconds, isRunning]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Play alarm and send notification when timer finishes
  useEffect(() => {
    if (hasFinished) {
      playAlarm();
      sendNotification();
    }
  }, [hasFinished]);

  // Audio alarm using Web Audio API
  const playAlarm = useCallback(() => {
    try {
      // Create or resume audio context (needed for iOS Safari)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // Resume context if suspended (iOS requirement)
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create oscillator for beep sound
      const playBeep = (startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.value = 0.3;

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Three beeps
      const now = ctx.currentTime;
      playBeep(now, 0.15);
      playBeep(now + 0.25, 0.15);
      playBeep(now + 0.5, 0.15);
    } catch (err) {
      console.error("Audio playback failed:", err);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  // Send push notification
  const sendNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t.restTimer.timeUp, {
        body: t.appName,
        icon: "/icons/icon-192.png",
        tag: "rest-timer",
      });
    }
  };

  const startTimer = () => {
    // Request notification permission on first start
    requestNotificationPermission();

    // Initialize audio context on user interaction (required by browsers)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }

    setHasFinished(false);
    setSecondsRemaining(defaultSeconds);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setHasFinished(false);
    setSecondsRemaining(defaultSeconds);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage for visual indicator
  const progressPercent =
    defaultSeconds > 0
      ? ((defaultSeconds - secondsRemaining) / defaultSeconds) * 100
      : 0;

  return (
    <div className="card-brutal p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[family-name:var(--font-bebas)] text-sm tracking-wider text-bone/60 uppercase">
          {t.restTimer.title}
        </h3>
        {isRunning && (
          <span className="text-xs text-bone/40 uppercase tracking-wider animate-pulse">
            {t.restTimer.resting}
          </span>
        )}
        {hasFinished && (
          <span className="text-xs text-crimson uppercase tracking-wider animate-pulse">
            {t.restTimer.timeUp}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="h-1 bg-steel rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-crimson transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Timer display */}
      <div className="text-center mb-4">
        <p
          className={`font-[family-name:var(--font-bebas)] text-5xl tabular-nums ${
            hasFinished ? "text-crimson animate-pulse" : "text-foreground"
          }`}
        >
          {formatTime(secondsRemaining)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex-1 py-3 bg-crimson text-background font-[family-name:var(--font-bebas)] tracking-wider uppercase text-sm"
          >
            {t.restTimer.start}
          </button>
        ) : (
          <>
            <button
              onClick={stopTimer}
              className="flex-1 py-3 bg-steel border border-steel-light text-bone/80 font-[family-name:var(--font-bebas)] tracking-wider uppercase text-sm"
            >
              {t.restTimer.stop}
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-3 bg-steel border border-steel-light text-bone/60 font-[family-name:var(--font-bebas)] tracking-wider uppercase text-sm"
            >
              {t.restTimer.reset}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
