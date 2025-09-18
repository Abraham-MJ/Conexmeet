import { useUser } from '@/app/context/useClientContext';
import { Ticket, CreateTicketRequest } from '@/app/types/tickets';
import { useEffect, useState } from 'react';
import useApi from '../useAPi';

export const useTickets = () => {
  const { state: user } = useUser();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const {
    data: ticketsData,
    loading: isLoading,
    error,
    execute: fetchTickets,
  } = useApi<Ticket[]>(
    '/api/tickets/get-tickets',
    {
      cacheTime: 2 * 60 * 1000,
      staleTime: 30 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const getTickets = async () => {
    try {
      const result = await fetchTickets();

      if (result?.success && result.data) {
        const sortedTickets = Array.isArray(result.data)
          ? result.data.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
          : [];
        setTickets(sortedTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('ERROR obteniendo tickets:', error);
      setTickets([]);
    }
  };

  const { execute: createTicketRequest } = useApi<any>(
    'https://app.conexmeet.live/api/v1/create-ticket',
    {
      method: 'POST',
      retryAttempts: 2,
      retryDelay: 2000,
    },
    false,
  );

  const createTicket = async (ticketData: CreateTicketRequest) => {
    try {
      const result = await createTicketRequest(
        'https://app.conexmeet.live/api/v1/create-ticket',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.user.token}`,
          },
          body: {
            title: ticketData.title,
            description: ticketData.description,
            priority: ticketData.priority,
            category: ticketData.category,
          },
        },
      );

      if (result?.success) {
        await getTickets();
        return result.data;
      } else if (result?.error) {
        throw new Error(result.error.message);
      }

      throw new Error('Error creating ticket');
    } catch (error) {
      console.error('Error creando ticket:', error);
      throw error;
    }
  };

  useEffect(() => {
    getTickets();
  }, []);

  const refreshTickets = async () => {
    await getTickets();
  };

  return { isLoading, tickets, createTicket, refreshTickets };
};

export const useTicketDetail = () => {
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const {
    loading: isLoading,
    error: apiError,
    execute: fetchTicketDetail,
  } = useApi<Ticket>(
    '/api/tickets/show-tickets',
    {
      cacheTime: 60 * 1000,
      staleTime: 30 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const error = apiError ? apiError.message : null;

  const getTicketDetail = async (ticketId: string | number) => {
    try {
      const result = await fetchTicketDetail(
        `/api/tickets/show-tickets?id=${ticketId}`,
      );

      if (result?.success && result.data) {
        setTicket(result.data);
      } else if (result?.error) {
        setTicket(null);
        throw new Error(
          result.error.message || 'No se recibieron datos del ticket',
        );
      }
    } catch (error) {
      console.error('ERROR obteniendo ticket:', error);
      setTicket(null);
      throw error;
    }
  };

  const { execute: sendMessageRequest } = useApi<any>(
    '/api/tickets/send-message',
    {
      method: 'POST',
      retryAttempts: 2,
      retryDelay: 1500,
    },
    false,
  );

  const sendMessage = async (ticketId: string | number, message: string) => {
    try {
      const result = await sendMessageRequest('/api/tickets/send-message', {
        method: 'POST',
        body: {
          ticketId,
          message,
        },
      });

      if (result?.success && result.data) {
        if (ticket) {
          const newComment = {
            id: result.data?.id || result.data || Date.now(),
            ticket_id:
              typeof ticketId === 'string' ? parseInt(ticketId) : ticketId,
            user_id: result.data?.user_id || ticket.user_id,
            message: message,
            created_at: result.data?.created_at || new Date().toISOString(),
            updated_at: result.data?.updated_at || new Date().toISOString(),
          };

          setTicket((prevTicket) => {
            if (!prevTicket) return prevTicket;
            return {
              ...prevTicket,
              comments: [...prevTicket.comments, newComment],
            };
          });
        }
        return result.data;
      } else if (result?.error) {
        throw new Error(result.error.message || 'Error al enviar el mensaje');
      }

      throw new Error('Error al enviar el mensaje');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  };

  return {
    isLoading,
    ticket,
    error,
    getTicketDetail,
    sendMessage,
  };
};
