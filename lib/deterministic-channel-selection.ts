
import { UserInformation } from '@/app/types/streams';


export function selectChannelDeterministically(
  availableChannels: UserInformation[],
  userId: number | string,
  attemptNumber: number = 0,
): UserInformation {
  if (availableChannels.length === 0) {
    throw new Error('No hay canales disponibles');
  }

  if (availableChannels.length === 1) {
    return availableChannels[0];
  }

  const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

  const hash = (userIdNum * 31 + attemptNumber * 17) % availableChannels.length;
  
  const index = Math.abs(hash);

  console.log(
    `[Deterministic Selection] Usuario ${userId}, Intento ${attemptNumber}: Seleccionando canal ${index}/${availableChannels.length - 1}`,
  );

  return availableChannels[index];
}


export function selectChannelRoundRobin(
  availableChannels: UserInformation[],
  userId: number | string,
  attemptNumber: number = 0,
): UserInformation {
  if (availableChannels.length === 0) {
    throw new Error('No hay canales disponibles');
  }

  if (availableChannels.length === 1) {
    return availableChannels[0];
  }

  const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

  const startIndex = userIdNum % availableChannels.length;
  const index = (startIndex + attemptNumber) % availableChannels.length;

  console.log(
    `[Round Robin Selection] Usuario ${userId}, Intento ${attemptNumber}: Seleccionando canal ${index}/${availableChannels.length - 1}`,
  );

  return availableChannels[index];
}


export function selectChannelWithTimestamp(
  availableChannels: UserInformation[],
  userId: number | string,
  attemptNumber: number = 0,
): UserInformation {
  if (availableChannels.length === 0) {
    throw new Error('No hay canales disponibles');
  }

  if (availableChannels.length === 1) {
    return availableChannels[0];
  }

  const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
  const now = Date.now();

  const seed = (userIdNum * 1000 + (now % 1000) + attemptNumber * 100);
  const index = Math.abs(seed) % availableChannels.length;

  console.log(
    `[Timestamp Selection] Usuario ${userId}, Intento ${attemptNumber}: Seleccionando canal ${index}/${availableChannels.length - 1}`,
  );

  return availableChannels[index];
}


export function selectChannelsPriority(
  availableChannels: UserInformation[],
  userId: number | string,
  maxChannels: number = 5,
): UserInformation[] {
  if (availableChannels.length === 0) {
    return [];
  }

  const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
  const result: UserInformation[] = [];
  const usedIndices = new Set<number>();

  for (let attempt = 0; attempt < Math.min(maxChannels, availableChannels.length); attempt++) {
    const hash = (userIdNum * 31 + attempt * 17) % availableChannels.length;
    const index = Math.abs(hash);

    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      result.push(availableChannels[index]);
    }
  }

  console.log(
    `[Priority Selection] Usuario ${userId}: Seleccionados ${result.length} canales en orden de prioridad`,
  );

  return result;
}


export function getChannelIdsDeterministically(
  availableChannels: UserInformation[],
  userId: number | string,
  maxChannels: number = 5,
): string[] {
  const selectedChannels = selectChannelsPriority(
    availableChannels,
    userId,
    maxChannels,
  );
  return selectedChannels
    .map((channel) => channel.host_id)
    .filter((id): id is string => id !== null && id !== undefined);
}
