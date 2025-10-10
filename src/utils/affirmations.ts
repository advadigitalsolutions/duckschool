// Personal affirmations for students
export function generateAffirmations(name: string): string[] {
  return [
    `${name} is worthy and deserving of love and happiness`,
    `${name} chooses to focus on the good in life`,
    `${name} is capable of amazing things`,
    `${name} believes in their abilities and potential`,
    `${name} is proud of the progress made today`,
    `${name} deserves success and will find it`,
    `${name} chooses to be confident and self-assured`,
    `${name} is in charge of how they feel and chooses happiness`,
    `${name} has the power to create change`,
    `${name} forgives themselves and learns from mistakes`,
    `${name} is brave and takes on new challenges with courage`,
    `${name} is smart and capable of learning anything`,
    `${name} is growing and improving every day`,
    `${name} is surrounded by love and support`,
    `${name} trusts in their journey and embraces their path`,
    `${name} is resilient and bounces back from setbacks`,
    `${name} celebrates small wins and acknowledges progress`,
    `${name} is unique and that is their superpower`,
    `${name} is enough exactly as they are`,
    `${name} attracts positive energy and opportunities`,
    `${name} is creative and full of brilliant ideas`,
    `${name} makes a difference in the world`,
    `${name} is patient with themselves while learning`,
    `${name} is becoming the best version of themselves`,
    `${name} radiates confidence and positivity`,
    `${name} is grateful for all the good things in life`,
    `${name} is open to new adventures and experiences`,
    `${name} trusts the process of life`,
    `${name} is a problem solver and figures things out`,
    `${name} is loved for who they are, not what they do`,
    `${name} has a beautiful mind full of wonderful thoughts`,
    `${name} is making their dreams come true one step at a time`,
    `${name} is proud of their hard work and dedication`,
    `${name} is kind to themselves and others`,
    `${name} is focused and gets things done`,
    `${name} is persistent and never gives up`,
    `${name} is adaptable and handles change with grace`,
    `${name} is wise beyond their years`,
    `${name} is a lifelong learner who loves to grow`,
    `${name} is surrounded by endless possibilities`,
  ];
}

export function getRandomAffirmation(name: string): string {
  const affirmations = generateAffirmations(name);
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

export function getAffirmationOfDay(name: string, date: Date = new Date()): string {
  const affirmations = generateAffirmations(name);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return affirmations[dayOfYear % affirmations.length];
}
