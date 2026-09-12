import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTypewriter } from '../../src/utils/typewriter';

const timings = { startDelay: 10, typeDelay: 10, deleteDelay: 5, holdDelay: 30, gapDelay: 20 };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); });

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

  it('backspaces an already displayed first title by grapheme and continues the normal loop', () => {
    const render = vi.fn();
    const player = createTypewriter(['👩‍💻e\u0301', 'C'], render, timings, { initialTitleComplete: true });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(render).not.toHaveBeenCalled();
    player.resume();
    vi.advanceTimersByTime(4);
    expect(render).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('👩‍💻');
    vi.advanceTimersByTime(5);
    expect(render).toHaveBeenLastCalledWith('');
    vi.advanceTimersByTime(19);
    expect(render).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('C');
    vi.advanceTimersByTime(60);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['👩‍💻', '', 'C', '', '👩‍💻', '👩‍💻e\u0301']);
    player.destroy();
  });

  it('preserves a partial initial backspace delay without adding typing randomness', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
    const render = vi.fn();
    const player = createTypewriter(['AB', 'C'], render, { ...timings, randomTypeDelay: 10 }, { initialTitleComplete: true });
    player.resume();
    vi.advanceTimersByTime(2);
    player.pause();
    vi.advanceTimersByTime(1000);
    player.resume();
    vi.advanceTimersByTime(2);
    expect(render).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
    expect(random).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5);
    expect(render).toHaveBeenLastCalledWith('');
    expect(random).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(29);
    expect(render).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('C');
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

  it('samples a new extra delay for each typed character, including the next title, but not deletion or holds', () => {
    const random = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValue(1 - Number.EPSILON);
    const render = vi.fn();
    const player = createTypewriter(['ABC', 'D'], render, { ...timings, randomTypeDelay: 10 });
    player.resume();
    vi.advanceTimersByTime(10);
    expect(render).toHaveBeenLastCalledWith('A');
    vi.advanceTimersByTime(14);
    expect(render).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('AB');
    vi.advanceTimersByTime(19);
    expect(render).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('ABC');
    expect(random).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(29);
    expect(render).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('AB');
    vi.advanceTimersByTime(10);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['A', 'AB', 'ABC', 'AB', 'A', '']);
    expect(random).toHaveBeenCalledTimes(4);
    vi.advanceTimersByTime(29);
    expect(render).toHaveBeenLastCalledWith('');
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('D');
    player.destroy();
  });

  it('adds randomness to the initial character and preserves sampled typing delays across pauses', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
    const render = vi.fn();
    const player = createTypewriter(['AB'], render, { ...timings, randomTypeDelay: 10 });
    player.resume();
    vi.advanceTimersByTime(19);
    expect(render).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
    vi.advanceTimersByTime(7);
    player.pause();
    vi.advanceTimersByTime(1000);
    player.resume();
    vi.advanceTimersByTime(12);
    expect(render).toHaveBeenCalledTimes(1);
    expect(random).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('AB');
    expect(random).toHaveBeenCalledTimes(2);
    player.destroy();
  });

  it.each([{}, { randomTypeDelay: 0 }])('keeps fixed timing without sampling randomness when disabled: %j', (settings) => {
    const random = vi.spyOn(Math, 'random');
    const render = vi.fn();
    const player = createTypewriter(['AB'], render, { ...timings, ...settings });
    player.resume();
    vi.advanceTimersByTime(20);
    expect(render.mock.calls.map(([text]) => text)).toEqual(['A', 'AB']);
    expect(random).not.toHaveBeenCalled();
    player.destroy();
  });

  it('keeps whole-millisecond extras within a fractional maximum', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
    const render = vi.fn();
    const player = createTypewriter(['A'], render, { ...timings, randomTypeDelay: 2.5 });
    player.resume();
    vi.advanceTimersByTime(11);
    expect(render).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(render).toHaveBeenLastCalledWith('A');
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

  it.each([-1, Infinity, NaN, 2_147_483_648])('rejects an invalid random typing delay: %s', (randomTypeDelay) => {
    expect(() => createTypewriter(['A'], vi.fn(), { randomTypeDelay })).toThrow('timer durations');
  });

  it.each(['typeDelay', 'startDelay', 'gapDelay'] as const)('rejects %s plus randomness exceeding the timer limit', (name) => {
    expect(() => createTypewriter(['A'], vi.fn(), { [name]: 2_147_483_647, randomTypeDelay: 1 }))
      .toThrow('including randomness');
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
