import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTypewriter, defaultTypewriterTimings } from '../../src/utils/typewriter';

const timings = { startDelay: 10, typeDelay: 10, deleteDelay: 5, holdDelay: 30, gapDelay: 20 };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe('typewriter player', () => {
  it('types, holds, deletes, waits, and loops through titles in order', () => {
    const render = vi.fn();
    const player = createTypewriter(['AB', 'C'], render, timings);
    expect(vi.getTimerCount()).toBe(0);
    player.resume();
    vi.advanceTimersByTime(9);
    expect(render).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
    vi.advanceTimersByTime(10);
    expect(render).toHaveBeenLastCalledWith('AB');
    vi.advanceTimersByTime(29);
    expect(render).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
    vi.advanceTimersByTime(5);
    expect(render).toHaveBeenLastCalledWith('');
    vi.advanceTimersByTime(19);
    expect(render).toHaveBeenCalledTimes(4);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('C');
    vi.advanceTimersByTime(50);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['A', 'AB', 'A', '', 'C', '', 'A']);
    player.destroy();
  });

  it('uses the default typing timing and 3.5-second hold', () => {
    const render = vi.fn();
    const player = createTypewriter(['AB'], render);
    player.resume();
    vi.advanceTimersByTime(defaultTypewriterTimings.startDelay);
    expect(render).toHaveBeenLastCalledWith('A');
    vi.advanceTimersByTime(defaultTypewriterTimings.typeDelay);
    expect(render).toHaveBeenLastCalledWith('AB');
    vi.advanceTimersByTime(3499);
    expect(render).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
    player.destroy();
  });

  it('preserves the remaining pause duration without scheduling duplicate timers', () => {
    const render = vi.fn();
    const player = createTypewriter(['A'], render, timings);
    player.pause();
    player.resume();
    player.resume();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(20);
    player.pause();
    player.pause();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(render).toHaveBeenCalledTimes(1);
    player.resume();
    vi.advanceTimersByTime(19);
    expect(render).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('');
    player.destroy();
  });

  it('cleans up permanently and cannot resume after destruction', () => {
    const render = vi.fn();
    const player = createTypewriter(['ABC'], render, timings);
    player.resume();
    vi.advanceTimersByTime(10);
    player.destroy();
    player.destroy();
    player.pause();
    player.resume();
    vi.advanceTimersByTime(5000);
    expect(vi.getTimerCount()).toBe(0);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it.each(['pause', 'destroy'] as const)('allows %s during a render callback', (action) => {
    const player = createTypewriter(['ABC'], () => { player[action](); }, timings);
    player.resume();
    vi.advanceTimersByTime(10);
    expect(vi.getTimerCount()).toBe(0);
    player.destroy();
  });

  it('types and deletes whole graphemes, not partial emoji or combining accents', () => {
    const render = vi.fn();
    const player = createTypewriter(['👩‍💻e\u0301'], render, timings);
    player.resume();
    vi.advanceTimersByTime(55);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['👩‍💻', '👩‍💻e\u0301', '👩‍💻', '']);
    player.destroy();
  });

  it('renders markup as literal text for the component to assign with textContent', () => {
    const render = vi.fn();
    const phrase = '<b>QA</b>';
    const player = createTypewriter([phrase], render, timings);
    player.resume();
    vi.advanceTimersByTime(phrase.length * 10);
    expect(render).toHaveBeenLastCalledWith(phrase);
    player.destroy();
  });

  it.each([[], [''], ['   '], ['Valid', '']])('rejects an empty phrase list or blank entry: %j', (...phrases) => {
    expect(() => createTypewriter(phrases as string[], vi.fn())).toThrow('non-empty phrases');
  });

  it.each([-1, Infinity, NaN, 2_147_483_648])('rejects an invalid duration: %s', (holdDelay) => {
    expect(() => createTypewriter(['A'], vi.fn(), { holdDelay })).toThrow('timer durations');
  });

  it('yields between steps even when all configured delays are zero', () => {
    const render = vi.fn();
    const player = createTypewriter(['A'], render, { startDelay: 0, typeDelay: 0, deleteDelay: 0, holdDelay: 0, gapDelay: 0 });
    player.resume();
    vi.advanceTimersByTime(3);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['A', '', 'A']);
    player.destroy();
  });
});
