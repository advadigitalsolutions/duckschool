// Personal affirmations for students with pronoun support
interface PronounSet {
  subject: string;  // they/she/he
  object: string;   // them/her/him
  possessive: string; // their/her/his
  reflexive: string; // themselves/herself/himself
}

function parsePronounSet(pronouns: string | null | undefined): PronounSet {
  const pronounStr = (pronouns || '').toLowerCase().trim();
  
  if (pronounStr.includes('she') || pronounStr.includes('her')) {
    return { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' };
  } else if (pronounStr.includes('he') || pronounStr.includes('him')) {
    return { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' };
  } else if (pronounStr.includes('ze') || pronounStr.includes('hir')) {
    return { subject: 'ze', object: 'hir', possessive: 'hir', reflexive: 'hirself' };
  } else if (pronounStr.includes('xe') || pronounStr.includes('xem')) {
    return { subject: 'xe', object: 'xem', possessive: 'xyr', reflexive: 'xemself' };
  }
  
  // Default to they/them
  return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themselves' };
}

export function generateAffirmations(name: string, pronouns?: string | null): string[] {
  const p = parsePronounSet(pronouns);
  
  return [
    `${name} is worthy and deserving of love and happiness`,
    `${name} chooses to focus on the good in life`,
    `${name} is capable of amazing things`,
    `${name} believes in ${p.possessive} abilities and potential`,
    `${name} is proud of the progress ${p.subject} made today`,
    `${name} deserves success and will find it`,
    `${name} chooses to be confident and self-assured`,
    `${name} is in charge of how ${p.subject} feels and chooses happiness`,
    `${name} has the power to create change`,
    `${name} forgives ${p.reflexive} and learns from mistakes`,
    `${name} is brave and takes on new challenges with courage`,
    `${name} is smart and capable of learning anything`,
    `${name} is growing and improving every day`,
    `${name} is surrounded by love and support`,
    `${name} trusts in ${p.possessive} journey and embraces ${p.possessive} path`,
    `${name} is resilient and bounces back from setbacks`,
    `${name} celebrates small wins and acknowledges progress`,
    `${name} is unique and that is ${p.possessive} superpower`,
    `${name} is enough exactly as ${p.subject} is`,
    `${name} attracts positive energy and opportunities`,
    `${name} is creative and full of brilliant ideas`,
    `${name} makes a difference in the world`,
    `${name} is patient with ${p.reflexive} while learning`,
    `${name} is becoming the best version of ${p.reflexive}`,
    `${name} radiates confidence and positivity`,
    `${name} is grateful for all the good things in life`,
    `${name} is open to new adventures and experiences`,
    `${name} trusts the process of life`,
    `${name} is a problem solver and figures things out`,
    `${name} is loved for who ${p.subject} is, not what ${p.subject} does`,
    `${name} has a beautiful mind full of wonderful thoughts`,
    `${name} is making ${p.possessive} dreams come true one step at a time`,
    `${name} is proud of ${p.possessive} hard work and dedication`,
    `${name} is kind to ${p.reflexive} and others`,
    `${name} is focused and gets things done`,
    `${name} is persistent and never gives up`,
    `${name} is adaptable and handles change with grace`,
    `${name} is wise beyond ${p.possessive} years`,
    `${name} is a lifelong learner who loves to grow`,
    `${name} is surrounded by endless possibilities`,
  ];
}

export function getRandomAffirmation(name: string, pronouns?: string | null): string {
  const affirmations = generateAffirmations(name, pronouns);
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

export function getAffirmationOfDay(name: string, pronouns?: string | null, date: Date = new Date()): string {
  const affirmations = generateAffirmations(name, pronouns);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return affirmations[dayOfYear % affirmations.length];
}
