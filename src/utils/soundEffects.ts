// Sound effects manager for Focus Journey duck
const sounds = {
  walk: '/sounds/duck-walk.mp3',
  climb: '/sounds/duck-climb.mp3',
  milestone: '/sounds/milestone-chime.mp3',
  complete: '/sounds/duck-celebrate.mp3'
};

// Array of fall sounds to randomly cycle through
const fallSounds = [
  '/sounds/duck-fall-1.mp3',
  '/sounds/duck-fall-2.mp3',
  '/sounds/duck-fall-3.mp3',
  '/sounds/duck-fall-4.mp3',
  '/sounds/duck-fall-5.mp3',
  '/sounds/duck-fall-6.mp3',
  '/sounds/duck-fall-7.mp3',
];

// Array of climb sounds to randomly cycle through
const climbSounds = [
  '/sounds/duck-climb-1.mp3',
  '/sounds/duck-climb-2.mp3',
  '/sounds/duck-climb-3.mp3',
  '/sounds/duck-climb-4.mp3',
  '/sounds/duck-climb-5.mp3',
  '/sounds/duck-climb-6.mp3',
  '/sounds/duck-climb-7.mp3',
  '/sounds/duck-climb-8.mp3',
  '/sounds/duck-climb-9.mp3',
  '/sounds/duck-climb-10.mp3',
];

// Array of attention sounds for when duck needs user to focus
const attentionSounds = [
  '/sounds/duck-attention-1.mp3',
  '/sounds/duck-attention-2.mp3',
  '/sounds/duck-attention-3.mp3',
  '/sounds/duck-attention-4.mp3',
  '/sounds/duck-attention-5.mp3',
  '/sounds/duck-attention-6.mp3',
  '/sounds/duck-attention-7.mp3',
  '/sounds/duck-attention-8.mp3',
  '/sounds/duck-attention-9.mp3',
  '/sounds/duck-attention-10.mp3',
];

// Array of click sounds for when user clicks the duck
const clickSounds = [
  '/sounds/duck-click-1.mp3',
  '/sounds/duck-click-2.mp3',
  '/sounds/duck-click-3.mp3',
  '/sounds/duck-click-4.mp3',
  '/sounds/duck-click-5.mp3',
  '/sounds/duck-click-6.mp3',
  '/sounds/duck-click-7.mp3',
  '/sounds/duck-click-8.mp3',
  '/sounds/duck-click-9.mp3',
  '/sounds/duck-click-10.mp3',
  '/sounds/duck-click-11.mp3',
  '/sounds/duck-click-12.mp3',
  '/sounds/duck-click-13.mp3',
  '/sounds/duck-click-14.mp3',
  '/sounds/duck-click-15.mp3',
  '/sounds/duck-click-16.mp3',
  '/sounds/duck-click-17.mp3',
  '/sounds/duck-click-18.mp3',
  '/sounds/duck-click-19.mp3',
];

// Array of return sounds for when duck climbs back after being away
const returnSounds = [
  '/sounds/duck-return-1.mp3',
  '/sounds/duck-return-2.mp3',
  '/sounds/duck-return-3.mp3',
  '/sounds/duck-return-4.mp3',
  '/sounds/duck-return-5.mp3',
];

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

// Play a random fall sound to keep it unpredictable
export const playRandomFallSound = (volume = 0.5) => {
  try {
    const randomIndex = Math.floor(Math.random() * fallSounds.length);
    const soundPath = fallSounds[randomIndex];
    
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    console.debug('Random fall sound playback failed');
  }
};

// Play a random climb sound to keep it unpredictable
export const playRandomClimbSound = (volume = 0.5) => {
  try {
    const randomIndex = Math.floor(Math.random() * climbSounds.length);
    const soundPath = climbSounds[randomIndex];
    
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    console.debug('Random climb sound playback failed');
  }
};

// Play a random attention sound to get user's focus
export const playRandomAttentionSound = (volume = 0.5) => {
  try {
    const randomIndex = Math.floor(Math.random() * attentionSounds.length);
    const soundPath = attentionSounds[randomIndex];
    
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    console.debug('Random attention sound playback failed');
  }
};

// Play a random click sound when user clicks the duck
export const playRandomClickSound = (volume = 0.5) => {
  try {
    const randomIndex = Math.floor(Math.random() * clickSounds.length);
    const soundPath = clickSounds[randomIndex];
    
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    console.debug('Random click sound playback failed');
  }
};

// Play a random return sound when duck climbs back after being away
export const playRandomReturnSound = (volume = 0.5) => {
  try {
    const randomIndex = Math.floor(Math.random() * returnSounds.length);
    const soundPath = returnSounds[randomIndex];
    
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    });
  } catch (error) {
    console.debug('Random return sound playback failed');
  }
};
