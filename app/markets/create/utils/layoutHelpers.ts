export const WIDTH_CLASSES: Record<number, string> = {
  1: 'w-full',
  2: 'w-1/2',
  3: 'w-1/3',
  4: 'w-1/4',
  5: 'w-1/5',
  6: 'w-1/6'
} as const;

export const getResponsiveWidthClass = (itemCount: number): string => {
  return WIDTH_CLASSES[itemCount] || 'w-full';
};