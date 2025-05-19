export function formatCustomDate(dateStringInput: string): string | null {
  if (!dateStringInput || typeof dateStringInput !== 'string') {
    console.error('La entrada debe ser una cadena de fecha válida.');
    return null;
  }

  let dateToParse = dateStringInput;
  const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (yyyyMmDdRegex.test(dateStringInput)) {
    dateToParse = dateStringInput + 'T00:00:00.000Z';
  }

  try {
    const date = new Date(dateToParse);

    if (isNaN(date.getTime())) {
      console.error(
        'Cadena de fecha inválida después de prepararla para parseo:',
        dateToParse,
      );
      return null;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return null;
  }
}
