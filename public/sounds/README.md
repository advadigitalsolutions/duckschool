# Sound Files for Focus Journey Duck

This directory should contain the following sound files:

1. **duck-walk.mp3** - Soft rhythmic quacking sound for walking animation (loops)
2. **duck-fall.mp3** - Descending "QUAAAAAACK!" scream when duck falls into gap
3. **duck-climb.mp3** - Grunting/effort sounds with quacks when duck climbs back
4. **duck-celebrate.mp3** - Happy excited quacks for milestone celebrations
5. **milestone-chime.mp3** - Musical chime for 25%, 50%, 75% milestones

## Sound Requirements

- Format: MP3 (recommended) or OGG
- Duration: 1-3 seconds (except walk which can loop)
- Volume: Normalized to prevent clipping
- License: CC0 or royalty-free

## Where to Get Sounds

1. **freesound.org** - Search for duck quacks and download CC0 licensed sounds
2. **AI Generation** - Use audio generation tools to create custom duck sounds
3. **Record Your Own** - Simple quacking sounds work great for the playful aesthetic

## Fallback Behavior

The app will continue to work without sound files - the `playSound()` function handles missing files gracefully. Sounds are enhancement, not requirement.
