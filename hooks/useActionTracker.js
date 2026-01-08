import { useCallback } from 'react';

export function useActionTracker() {
  const trackAction = useCallback(async (actionType, targetType, targetId, targetName, metadata = {}) => {
    try {
      // Get user from localStorage
      const savedUser = localStorage.getItem('off2_chat_user');
      if (!savedUser) {
        // No user identity saved, don't track
        return false;
      }

      const { userId, school } = JSON.parse(savedUser);
      if (!userId || !school?.name) {
        // Incomplete user identity, don't track
        return false;
      }

      // Send to tracking API
      const res = await fetch('/api/track-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          college: school.name,
          collegeLogo: school.logo || null,
          actionType,
          targetType,
          targetId,
          targetName,
          metadata
        })
      });

      return res.ok;
    } catch (err) {
      console.error('Error tracking action:', err);
      return false;
    }
  }, []);

  // Check if user has identity saved
  const hasUserIdentity = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('off2_chat_user');
      if (!savedUser) return false;
      const { userId, school } = JSON.parse(savedUser);
      return !!(userId && school?.name);
    } catch {
      return false;
    }
  }, []);

  return { trackAction, hasUserIdentity };
}

// Standalone function for use outside of React components
export async function trackUserAction(actionType, targetType, targetId, targetName, metadata = {}) {
  try {
    const savedUser = localStorage.getItem('off2_chat_user');
    if (!savedUser) return false;

    const { userId, school } = JSON.parse(savedUser);
    if (!userId || !school?.name) return false;

    const res = await fetch('/api/track-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        college: school.name,
        collegeLogo: school.logo || null,
        actionType,
        targetType,
        targetId,
        targetName,
        metadata
      })
    });

    return res.ok;
  } catch (err) {
    console.error('Error tracking action:', err);
    return false;
  }
}

