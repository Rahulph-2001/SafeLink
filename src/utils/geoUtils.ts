export const formatTimeElapsed = (start: Date, current: Date = new Date()): string => {
  const diffInSeconds = Math.floor((current.getTime() - start.getTime()) / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  const seconds = diffInSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
