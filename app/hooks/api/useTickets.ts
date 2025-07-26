import { useUser } from '@/app/context/useClientContext';
import { Ticket, CreateTicketRequest } from '@/app/types/tickets';
import { useEffect, useState } from 'react';


export const useTickets = () => {
    const { state: user } = useUser()
    const [isLoading, setIsLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const getTickets = async () => {
        try {
            console.log('Obteniendo lista de tickets...');
            const response = await fetch('/api/tickets/get-tickets');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Respuesta de tickets:', result);

            const tickets = result.data?.data ?? [];
            
            const sortedTickets = Array.isArray(tickets) 
                ? tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                : [];
            
            setTickets(sortedTickets);
            console.log('Tickets actualizados y ordenados:', sortedTickets.length);

        } catch (error) {
            console.error('ERROR obteniendo tickets:', error);
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }




    const createTicket = async (ticketData: CreateTicketRequest) => {
        try {
            // Crear headers sin caracteres especiales
            const headers = new Headers();
            headers.set('Accept', 'application/json');
            headers.set('Content-Type', 'application/json');
            headers.set('Authorization', `Bearer ${user.user.token}`);

            const response = await fetch("https://app.conexmeet.live/api/v1/create-ticket", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    title: ticketData.title,
                    description: ticketData.description,
                    priority: ticketData.priority,
                    category: ticketData.category
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Ticket creado exitosamente:', result);

            await getTickets();
            
            return result;

        } catch (error) {
            console.error('Error creando ticket:', error);
            throw error;
        }
    };

    useEffect(() => {
        getTickets()
    }, [])

    const refreshTickets = async () => {
        setIsLoading(true);
        await getTickets();
    };

    return { isLoading, tickets, createTicket, refreshTickets };
};

export const useTicketDetail = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getTicketDetail = async (ticketId: string | number) => {
        console.log('🔄 getTicketDetail llamado para ticket:', ticketId);
        setIsLoading(true);
        setError(null);

        try {
            console.log('Obteniendo detalle del ticket:', ticketId);
            const response = await fetch(`/api/tickets/show-tickets?id=${ticketId}`);
            const result = await response.json();

            console.log('Respuesta del servidor:', result);

            if (!response.ok) {
                const errorMessage = result.error || `Error ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            if (!result.data) {
                throw new Error('No se recibieron datos del ticket');
            }

            setTicket(result.data);
        } catch (error) {
            console.error('ERROR obteniendo ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setError(errorMessage);
            setTicket(null);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (ticketId: string | number, message: string) => {
        try {
            const response = await fetch('/api/tickets/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ticketId,
                    message
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar el mensaje');
            }

            console.log('Respuesta de sendMessage:', result);

            if (ticket) {
                const newComment = {
                    id: result.data?.id || result.id || Date.now(),
                    ticket_id: typeof ticketId === 'string' ? parseInt(ticketId) : ticketId,
                    user_id: result.data?.user_id || result.user_id || ticket.user_id,
                    message: message, 
                    created_at: result.data?.created_at || result.created_at || new Date().toISOString(),
                    updated_at: result.data?.updated_at || result.updated_at || new Date().toISOString()
                };

                console.log('Agregando comentario localmente:', newComment);

                setTicket(prevTicket => {
                    if (!prevTicket) return prevTicket;
                    return {
                        ...prevTicket,
                        comments: [...prevTicket.comments, newComment]
                    };
                });
            }

            return result;
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
        sendMessage
    };
};
