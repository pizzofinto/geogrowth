/**
 * Formats a timestamp to show when it was last accessed
 */
export function formatLastAccessed(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Right now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute ago' : 'minutes ago'}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour ago' : 'hours ago'}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day ago' : 'days ago'}`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week ago' : 'weeks ago'}`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? 'month ago' : 'months ago'}`;
  } else {
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  }
}

/**
 * Formats a date in readable Italian format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats a milestone date showing how much time is left or has passed
 */
export function formatMilestoneDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < -7) {
    // More than a week ago
    return `${Math.abs(diffInDays)} days ago`;
  } else if (diffInDays < 0) {
    // 1 to 7 days ago
    return `${Math.abs(diffInDays)} days ago`;
  } else if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Tomorrow';
  } else if (diffInDays < 7) {
    return `In ${diffInDays} days`;
  } else if (diffInDays < 30) {
    const weeks = Math.ceil(diffInDays / 7);
    return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    // For distant dates, show formatted date
    return formatDate(dateString);
  }
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

/**
 * Checks if a date is within a certain number of days
 */
export function isWithinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  return diffInDays >= 0 && diffInDays <= days;
}