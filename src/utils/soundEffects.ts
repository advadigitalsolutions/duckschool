// Sound effects manager for Focus Journey duck
const sounds = {
  walk: '/sounds/duck-walk.mp3',
  fall: '/sounds/duck-fall.mp3',
  climb: '/sounds/duck-climb.mp3',
  milestone: '/sounds/milestone-chime.mp3',
  complete: '/sounds/duck-celebrate.mp3'
};

type SoundName = keyof typeof sounds;

// Preload sounds for better performance
const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {};

export const preloadSounds = () => {
  Object.entries(sounds).forEach(([name, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[name as SoundName] = audio;
  });
};

export const playSound = (name: SoundName, volume = 0.5) => {
  try {
    let audio = audioCache[name];
    
    if (!audio) {
      audio = new Audio(sounds[name]);
      audioCache[name] = audio;
    }
    
    // Clone audio for overlapping sounds
    const soundClone = audio.cloneNode() as HTMLAudioElement;
    soundClone.volume = volume;
    soundClone.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    // Silently fail
    console.debug('Sound playback failed:', name);
  }
};

export const stopSound = (name: SoundName) => {
  const audio = audioCache[name];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
};
