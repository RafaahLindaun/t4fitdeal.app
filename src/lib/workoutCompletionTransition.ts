const pendingUsers = new Set<string>();

export function markWorkoutCompletionTransition(userId: string) {
  if (userId) pendingUsers.add(userId);
}

export function consumeWorkoutCompletionTransition(userId: string) {
  if (!userId || !pendingUsers.has(userId)) return false;
  pendingUsers.delete(userId);
  return true;
}
