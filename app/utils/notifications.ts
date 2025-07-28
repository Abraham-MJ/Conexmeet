export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showBrowserNotification = (
  title: string,
  options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {},
) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      ...options,
      requireInteraction: false,
    });

    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }
  return null;
};

export const isDocumentHidden = (): boolean => {
  return document.hidden || document.visibilityState === 'hidden';
};
