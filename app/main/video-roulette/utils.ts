export const getHistories = async () => {
  try {
    const response = await fetch('/api/histories', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Error en API externa: ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error al obtener historiales:', error);
    throw error;
  }
};
