import { BOOT_CUES, synthesizeSound, type Sound } from "./audio-synthesis";
import { hasTypingBetween } from "./typing-rhythm";

const preferenceKey = "hansen.boot-sound";
const readPreference = () => {
  try {
    return localStorage.getItem(preferenceKey) === "on";
  } catch {
    return false;
  }
};

/** Shared opening and interface effects. Gesture handling belongs to the app. */
export class BootAudio {
  enabled = readPreference();
  private context?: AudioContext;
  private bus?: GainNode;
  private voices: ReturnType<typeof synthesizeSound>[] = [];
  private previous: number | null = null;
  private interactionAllowed = false;
  private interactionRequest = 0;
  private active = false;
  private disposed = false;
  private lastSound = new Map<Sound, number>();
  private played = new Map<Sound, number>();
  private error = "";
  get playing() {
    return this.active && this.enabled && this.context?.state === "running";
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    try {
      localStorage.setItem(preferenceKey, value ? "on" : "off");
    } catch {
      /* optional storage */
    }
    if (!value) this.stop();
  }
  /** Call synchronously from the click before awaiting anything. */
  async activate() {
    if (!this.enabled || this.disposed || document.hidden) return false;
    this.active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!this.context) {
        const c = (this.context = new AudioContext());
        const master = c.createGain(),
          limiter = c.createDynamicsCompressor();
        this.bus = c.createGain();
        this.bus.gain.value = 0.55;
        master.gain.value = 0.8;
        limiter.threshold.value = -8;
        limiter.knee.value = 8;
        limiter.ratio.value = 6;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.18;
        this.bus.connect(master);
        master.connect(limiter);
        limiter.connect(c.destination);
      }
      const c = this.context;
      const resumed = c.state === "running" ? Promise.resolve() : c.resume();
      // A device can finish resuming after the bounded attempt or after Skip.
      void resumed
        .then(() => {
          if (
            (!this.active ||
              this.disposed ||
              !this.enabled ||
              document.hidden) &&
            c.state !== "closed"
          )
            void c.suspend().catch(() => {});
        })
        .catch(() => {});
      await Promise.race([
        resumed,
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Audio activation timed out")),
            1500,
          );
        }),
      ]);
      if (!this.active || this.disposed || !this.enabled || document.hidden) {
        if (c.state !== "closed") void c.suspend().catch(() => {});
        return false;
      }
      this.error = c.state === "running" ? "" : "Audio is suspended";
      return c.state === "running";
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Audio unavailable";
      this.stop();
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
  allowInteractions() {
    this.interactionAllowed = true;
  }
  interact(sound: Sound, pan = 0) {
    if (
      !this.interactionAllowed ||
      !this.enabled ||
      this.disposed ||
      document.hidden
    )
      return;
    if (this.playing) {
      this.play(sound, pan);
      return;
    }
    // Keep only the latest action while the device resumes; never queue a burst.
    const request = ++this.interactionRequest;
    void this.activate().then((unlocked) => {
      if (
        unlocked &&
        request === this.interactionRequest &&
        this.playing &&
        !document.hidden
      )
        this.play(sound, pan);
    });
  }
  resume() {
    return this.context ? this.activate() : Promise.resolve(false);
  }
  reset() {
    this.interactionRequest++;
    this.stopVoices();
    this.previous = null;
  }
  private stopVoices() {
    if (this.context) {
      const now = this.context.currentTime;
      this.voices.forEach((voice) => voice.stop(now));
    }
    this.voices = [];
    this.lastSound.clear();
  }
  stop() {
    this.active = false;
    this.reset();
    if (this.context?.state !== "closed")
      void this.context?.suspend().catch(() => {});
  }
  update(appTime: number) {
    const time = appTime + 5,
      previous = this.previous;
    this.previous = time;
    if (!this.playing || document.hidden || previous === null) return;
    if (time < previous || time - previous > 0.3) {
      this.stopVoices();
      return;
    }
    for (const cue of BOOT_CUES) {
      // Later cues belong to the original interactive archive, not this opening.
      if (cue.time < 26.92 && cue.time > previous && cue.time <= time)
        this.play(cue.sound);
    }
    if (hasTypingBetween(previous, time)) this.play("key");
  }
  private play(sound: Sound, pan = 0) {
    if (!this.playing || document.hidden) return;
    const c = this.context!;
    const now = c.currentTime,
      interval =
        sound === "key"
          ? 0.024
          : sound === "tick" || sound === "column"
            ? 0.055
            : 0.12;
    if (now - (this.lastSound.get(sound) ?? -Infinity) < interval) return;
    this.lastSound.set(sound, now);
    this.voices = this.voices.filter((voice) => voice.end > now);
    if (this.voices.length >= 10) this.voices.shift()!.stop(now);
    this.voices.push(synthesizeSound(c, this.bus!, sound, now + 0.004, pan));
    this.played.set(sound, (this.played.get(sound) ?? 0) + 1);
  }
  stats() {
    return {
      enabled: this.enabled,
      active: this.active,
      state: this.context?.state ?? "locked",
      voices: this.voices.filter(
        (v) => v.end > (this.context?.currentTime ?? 0),
      ).length,
      played: Object.fromEntries(this.played),
      error: this.error,
    };
  }
  dispose() {
    this.disposed = true;
    this.stop();
    void this.context?.close().catch(() => {});
  }
}
