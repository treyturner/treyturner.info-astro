export const defaultTypewriterTimings = {
  typeDelay: 70,
  deleteDelay: 40,
  holdDelay: 3500,
  gapDelay: 450,
  startDelay: 500,
};

export type TypewriterTimings = typeof defaultTypewriterTimings;

/** A pausable typing/deleting loop. Rendering and accessibility belong to the component. */
export function createTypewriter(
  phrases: readonly string[],
  onChange: (text: string) => void,
  timings: Partial<TypewriterTimings> = {},
) {
  if (!phrases.length || phrases.some((phrase) => !phrase.trim())) {
    throw new Error('Typewriter requires non-empty phrases');
  }
  const delays = { ...defaultTypewriterTimings, ...timings };
  if (Object.values(delays).some((delay) => !Number.isFinite(delay) || delay < 0 || delay > 2_147_483_647)) {
    throw new Error('Typewriter delays must be finite, non-negative timer durations');
  }
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const words = phrases.map((phrase) => Array.from(segmenter.segment(phrase), ({ segment }) => segment));
  let word = 0;
  let length = 0;
  let deleting = false;
  let paused = true;
  let destroyed = false;
  let remaining = delays.startDelay;
  let dueAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function schedule() {
    // A zero setting still yields to the browser instead of creating a busy loop.
    remaining = Math.max(1, remaining);
    dueAt = Date.now() + remaining;
    timer = setTimeout(tick, remaining);
  }

  function tick() {
    timer = undefined;
    const characters = words[word];
    length += deleting ? -1 : 1;
    const text = characters.slice(0, length).join('');
    if (!deleting) {
      remaining = delays.typeDelay;
      if (length === characters.length) {
        deleting = true;
        remaining = delays.holdDelay;
      }
    } else {
      remaining = delays.deleteDelay;
      if (length === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        remaining = delays.gapDelay;
      }
    }
    onChange(text);
    if (!paused) schedule();
  }

  function pause() {
    if (paused) return;
    paused = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(1, dueAt - Date.now());
    }
  }

  return {
    resume() {
      if (destroyed || !paused) return;
      paused = false;
      schedule();
    },
    pause,
    destroy() {
      pause();
      destroyed = true;
    },
  };
}
