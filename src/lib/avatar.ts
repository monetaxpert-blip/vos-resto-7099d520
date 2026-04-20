/** Generate avatar URL based on gender, using DiceBear (no API key needed). */
export type Gender = 'male' | 'female' | 'unspecified';

export function avatarFor(seed: string, gender: Gender = 'unspecified'): string {
  const safe = encodeURIComponent(seed || 'guest');
  const base = 'https://api.dicebear.com/7.x';
  if (gender === 'male') {
    // Avataaars : top short / hair brown
    return `${base}/avataaars/svg?seed=${safe}&top=shortHair,shortRound,shortFlat&facialHairType=blank&backgroundColor=b6e3f4`;
  }
  if (gender === 'female') {
    return `${base}/avataaars/svg?seed=${safe}&top=longHair,longHairStraight,longHairCurly&backgroundColor=ffd5dc`;
  }
  return `${base}/initials/svg?seed=${safe}&backgroundColor=e0e0e0&textColor=000`;
}
