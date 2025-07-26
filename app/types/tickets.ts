export interface TicketCategory {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    pivot: {
        ticket_id: number;
        category_id: number;
    };
}

export interface TicketLabel {
    id: number;
    name: string;
    color?: string;
    created_at: string;
    updated_at: string;
    pivot: {
        ticket_id: number;
        label_id: number;
    };
}

export interface TicketAgent {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

export interface TicketComment {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    created_at: string;
    updated_at: string;
}

export type TicketPriorityValue = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatusValue = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = TicketPriorityValue | 'all';
export type TicketStatus = TicketStatusValue | 'all';

export interface Ticket {
    id: number;
    user_id: number;
    title: string;
    description: string;
    attachment: string | null;
    priority: TicketPriorityValue;
    status: TicketStatusValue;
    agent_id: number | null;
    created_at: string;
    updated_at: string;
    categories: TicketCategory[];
    labels: TicketLabel[];
    agent: TicketAgent | null;
    comments: TicketComment[];
}

export interface CreateTicketRequest {
    title: string;
    description: string;
    priority: TicketPriorityValue;
    category: string;
}

export interface UpdateTicketRequest {
    title?: string;
    description?: string;
    priority?: TicketPriorityValue;
    status?: TicketStatusValue;
    agent_id?: number | null;
    category_ids?: number[];
    label_ids?: number[];
}

export interface TicketsResponse {
    data: Ticket[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}