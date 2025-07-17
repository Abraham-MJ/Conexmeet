export function converterMinutes(timeString: string): number | null {
  if (typeof timeString !== 'string') {
    console.error('El valor de entrada debe ser un string.');
    return null;
  }

  const parts = timeString.split(':');
  if (parts.length !== 3) {
    return null;
  }

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  let seconds = parseInt(parts[2], 10);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    console.error('Partes del tiempo no son números válidos:', parts);
    return null;
  }

  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds %= 60;
  }

  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes %= 60;
  }

  const totalMinutes = hours * 60 + minutes + seconds / 60;
  return Math.trunc(totalMinutes);
}
