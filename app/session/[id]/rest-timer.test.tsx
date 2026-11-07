// Browser capability mocks: these tests are not physical Android handset proof.
// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RestTimer } from './rest-timer';
import { translations } from '../../../lib/translations';

const t = translations.en;
const showNotification = vi.fn();
const notification = vi.fn(function (): void {
  throw new TypeError("Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.");
});

beforeEach(() => {
  vi.useFakeTimers();
  showNotification.mockResolvedValue(undefined);
  vi.stubGlobal('Notification', Object.assign(notification, {
    permission: 'granted', requestPermission: vi.fn().mockResolvedValue('granted'),
  }));
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
    getRegistration: vi.fn().mockResolvedValue({ active: {}, showNotification }),
  } });
  vi.stubGlobal('AudioContext', class {
    state = 'running'; currentTime = 0; destination = {};
    createOscillator() { return { connect() {}, frequency: {}, start() {}, stop() {} }; }
    createGain() { return { connect() {}, gain: {} }; }
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('completes the real timer when the Android Notification constructor throws', async () => {
  render(<RestTimer defaultSeconds={1} translations={t} />);
  fireEvent.click(screen.getByRole('button', { name: t.restTimer.start }));
  await act(async () => { vi.advanceTimersByTime(1000); });
  expect(screen.getByText(t.restTimer.timeUp)).toBeTruthy();
  expect(showNotification).toHaveBeenCalledWith(t.restTimer.timeUp, {
    body: t.appName, icon: '/icons/icon-192.png', tag: 'rest-timer',
  });
  expect(notification).not.toHaveBeenCalled();
});

async function complete() {
  fireEvent.click(screen.getByRole('button', { name: t.restTimer.start }));
  await act(async () => { vi.advanceTimersByTime(1000); });
  expect(screen.getByText(t.restTimer.timeUp)).toBeTruthy();
  expect(screen.getByRole('button', { name: t.restTimer.start })).toBeTruthy();
}

it.each(['denied', 'default'] as const)('completes with %s permission', async (permission) => {
  Object.defineProperty(Notification, 'permission', { configurable: true, value: permission });
  vi.mocked(Notification.requestPermission).mockResolvedValue(permission);
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(showNotification).not.toHaveBeenCalled();
  expect(notification).not.toHaveBeenCalled();
  expect(Notification.requestPermission).toHaveBeenCalledTimes(permission === 'default' ? 1 : 0);
});

it('requests default permission on start and notifies after it is granted', async () => {
  Object.defineProperty(Notification, 'permission', { configurable: true, value: 'default' });
  vi.mocked(Notification.requestPermission).mockImplementation(async () => {
    Object.defineProperty(Notification, 'permission', { configurable: true, value: 'granted' });
    return 'granted';
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(showNotification).toHaveBeenCalledTimes(1);
});

it.each(['throw', 'reject'])('contains permission %s', async (failure) => {
  Object.defineProperty(Notification, 'permission', { configurable: true, value: 'default' });
  vi.mocked(Notification.requestPermission).mockImplementation(() => {
    if (failure === 'throw') throw new Error('Permission unavailable');
    return Promise.reject(new Error('Permission unavailable'));
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
});

it('works without Notification, service workers, or audio support', async () => {
  vi.stubGlobal('Notification', undefined);
  vi.stubGlobal('AudioContext', undefined);
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
});

it.each(['throw', 'reject'])('contains showNotification %s', async (failure) => {
  showNotification.mockImplementation(() => {
    if (failure === 'throw') throw new Error('Notification unavailable');
    return Promise.reject(new Error('Notification unavailable'));
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
});

it('contains a throwing constructor when no service worker exists', async () => {
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(notification).toHaveBeenCalledTimes(1);
});

it('supports the desktop constructor fallback', async () => {
  notification.mockImplementationOnce(function () {});
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(notification).toHaveBeenCalledTimes(1);
});

it('stops, resets, restarts and completes only once per run', async () => {
  render(<RestTimer defaultSeconds={2} translations={t} />);
  const start = () => fireEvent.click(screen.getByRole('button', { name: t.restTimer.start }));
  start();
  await act(async () => { vi.advanceTimersByTime(1000); });
  expect(screen.getByText('0:01')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: t.restTimer.stop }));
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(showNotification).not.toHaveBeenCalled();
  start();
  fireEvent.click(screen.getByRole('button', { name: t.restTimer.reset }));
  expect(screen.getByText('0:02')).toBeTruthy();
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(showNotification).not.toHaveBeenCalled();
  start();
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(screen.getByText(t.restTimer.timeUp)).toBeTruthy();
  expect(showNotification).toHaveBeenCalledTimes(1);
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(showNotification).toHaveBeenCalledTimes(1);
  start();
  expect(screen.queryByText(t.restTimer.timeUp)).toBeNull();
  await act(async () => { vi.advanceTimersByTime(2000); });
  expect(showNotification).toHaveBeenCalledTimes(2);
});

it.each(['throw', 'reject'])('contains service-worker lookup %s', async (failure) => {
  vi.mocked(navigator.serviceWorker.getRegistration).mockImplementation(() => {
    if (failure === 'throw') throw new Error('Worker unavailable');
    return Promise.reject(new Error('Worker unavailable'));
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
});

it.each(['throw', 'reject'])('contains service-worker registration %s', async (failure) => {
  vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(undefined);
  const register = vi.fn(() => {
    if (failure === 'throw') throw new Error('Registration unavailable');
    return Promise.reject(new Error('Registration unavailable'));
  });
  Object.assign(navigator.serviceWorker, { register });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(register).toHaveBeenCalledWith('/sw.js');
});

it('uses a newly active registration on completion without waiting for ready', async () => {
  const registration = { active: null as object | null, showNotification };
  const getRegistration = vi.fn().mockResolvedValue(undefined);
  const register = vi.fn().mockImplementation(async () => {
    getRegistration.mockResolvedValue(registration);
    return registration;
  });
  const ready = vi.fn(() => new Promise(() => {}));
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
    getRegistration, register, get ready() { return ready(); },
  } });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await act(async () => {});
  expect(register).toHaveBeenCalledTimes(1);
  await complete(); // Still installing: constructor fallback is safely contained.
  expect(showNotification).not.toHaveBeenCalled();
  registration.active = {};
  await complete(); // No controller/reload needed once the registration is active.
  expect(showNotification).toHaveBeenCalledTimes(1);
  expect(ready).not.toHaveBeenCalled();
});

it('keeps the timer usable while registration remains pending', async () => {
  vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(undefined);
  Object.assign(navigator.serviceWorker, { register: vi.fn(() => new Promise(() => {})) });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
});

it.each(['constructor', 'resume throw', 'resume reject', 'oscillator'])('contains audio %s failure independently of notifications', async (failure) => {
  vi.stubGlobal('AudioContext', class {
    state = failure.startsWith('resume') ? 'suspended' : 'running';
    constructor() { if (failure === 'constructor') throw new Error('Audio unavailable'); }
    resume() {
      if (failure === 'resume throw') throw new Error('Resume unavailable');
      return Promise.reject(new Error('Resume unavailable'));
    }
    createOscillator() { throw new Error('Playback unavailable'); }
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(showNotification).toHaveBeenCalledTimes(1);
});

it('resumes suspended audio and plays three beeps', async () => {
  const resume = vi.fn().mockResolvedValue(undefined);
  const start = vi.fn();
  vi.stubGlobal('AudioContext', class {
    state = 'suspended'; currentTime = 0; destination = {};
    resume = resume;
    createOscillator() { return { connect() {}, frequency: {}, start, stop() {} }; }
    createGain() { return { connect() {}, gain: {} }; }
  });
  render(<RestTimer defaultSeconds={1} translations={t} />);
  await complete();
  expect(resume).toHaveBeenCalled();
  expect(start).toHaveBeenCalledTimes(3);
  expect(showNotification).toHaveBeenCalledTimes(1);
});

it('cleans up the countdown when unmounted', async () => {
  const { unmount } = render(<RestTimer defaultSeconds={1} translations={t} />);
  fireEvent.click(screen.getByRole('button', { name: t.restTimer.start }));
  unmount();
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(showNotification).not.toHaveBeenCalled();
});
