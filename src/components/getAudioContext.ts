let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = typeof AudioContext !== 'undefined'
      ? new AudioContext()
      : new (window as any).webkitAudioContext();

  }
  if (!audioContext) {
    throw new Error('Could not create audioContext');
  }

  return audioContext;
}
