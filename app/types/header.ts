interface BaseRoutes {
  female: {
    videoChat: string;
    chats: string;
    ranking: string;
    contacts: string;
  };
  male: {
    forYou: string;
    videoChat: string;
    chats: string;
  };
}

interface HeaderProps {
  routes: BaseRoutes;
}
