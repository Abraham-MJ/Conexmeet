export const createHost = () => {
  try {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let host_id = '';

    for (let i = 0; i < 20; i++) {
      if (i > 0 && i % 4 === 0) {
        host_id += '-';
      }
      host_id += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    return host_id;
  } catch (error) {
    console.error('ERROR GENERATE TOKEN', error);
  }
};
