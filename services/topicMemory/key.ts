export const getMemoryKey = (workspaceId: string, conversationId: string): string => {
  if (!conversationId || conversationId.trim() === '') {
    return workspaceId;
  }
  return `${workspaceId}:${conversationId}`;
};

export const parseMemoryKey = (key: string): { workspaceId: string; conversationId: string } | null => {
  const parts = key.split(':');
  if (parts.length >= 2) {
    return {
      workspaceId: parts[0],
      conversationId: parts.slice(1).join(':'),
    };
  }
  return null;
};
