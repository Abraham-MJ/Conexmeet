import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import StyledModal from '../../UI/StyledModal'
import { Ticket } from '@/app/types/tickets'
import { useTicketDetail } from '@/app/hooks/api/useTickets'
import { IoMdClose } from 'react-icons/io'
import { useTranslation } from '@/app/hooks/useTranslation'

interface ModalDetailTicketsProps {
    ticketId: number | null;
    onClose: () => void;
    isOpen: boolean;
}

const getPriorityConfig = (t: (key: string) => string): Record<Ticket["priority"], { class: string; label: string; icon: string }> => ({
    urgent: {
        class: "bg-red-50 text-red-700 border-red-200 ring-red-100",
        label: t('ticket.priority.urgent'),
        icon: "🔥"
    },
    high: {
        class: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-100",
        label: t('ticket.priority.high'),
        icon: "⚡"
    },
    medium: {
        class: "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100",
        label: t('ticket.priority.medium'),
        icon: "⚠️"
    },
    low: {
        class: "bg-green-50 text-green-700 border-green-200 ring-green-100",
        label: t('ticket.priority.low'),
        icon: "📝"
    },
})

const getStatusConfig = (t: (key: string) => string): Record<Ticket["status"], { class: string; label: string; icon: string }> => ({
    open: {
        class: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
        label: t('ticket.status.open'),
        icon: "🔓"
    },
    in_progress: {
        class: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-100",
        label: t('ticket.status.inProgress'),
        icon: "⏳"
    },
    resolved: {
        class: "bg-green-50 text-green-700 border-green-200 ring-green-100",
        label: t('ticket.status.resolved'),
        icon: "✅"
    },
    closed: {
        class: "bg-gray-50 text-gray-700 border-gray-200 ring-gray-100",
        label: t('ticket.status.closed'),
        icon: "🔒"
    },
})




const ModalDetailTickets: React.FC<ModalDetailTicketsProps> = ({ onClose, ticketId, isOpen }) => {
    const { ticket, isLoading, error, getTicketDetail, sendMessage } = useTicketDetail();
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        console.log('useEffect ejecutado - isOpen:', isOpen, 'ticketId:', ticketId);
        if (isOpen && ticketId) {
            console.log('Cargando ticket detail desde useEffect');
            getTicketDetail(ticketId);
        }
    }, [isOpen, ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket?.comments]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && ticketId && !isSending) {
            setIsSending(true);
            try {
                await sendMessage(ticketId, newMessage.trim());
                setNewMessage("");
            } catch (error) {
                console.error(t('ticket.detail.sendError'), error);
            } finally {
                setIsSending(false);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <StyledModal
                isOpen={isOpen}
                onClose={onClose}
                title=""
                position="center"
                noClose
                noPadding
                width="800px"
            >
                <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{t('ticket.detail.loading')}</span>
                </div>
            </StyledModal>
        );
    }
    
    if (error || !ticket) {
        return (
            <StyledModal
                isOpen={isOpen}
                onClose={onClose}
                title=""
                position="center"
                noClose
                noPadding
                width="800px"
            >
                <div className="mx-4 bg-white dark:bg-gray-800 p-6">
                    <div className="flex items-center justify-center h-64 flex-col bg-white dark:bg-gray-800 p-6">
                        <div className="text-red-600 dark:text-red-400 text-center mb-4">
                            <h3 className="text-lg font-semibold mb-2">{t('ticket.detail.error')}</h3>
                            <p className="text-sm">
                                {error || t('ticket.detail.errorDescription')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => ticketId && getTicketDetail(ticketId)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {t('ticket.detail.retry')}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            </StyledModal>
        );
    }

    const priorityConfig = getPriorityConfig(t)
    const statusConfig = getStatusConfig(t)
    const priorityInfo = priorityConfig[ticket.priority]
    const statusInfo = statusConfig[ticket.status]

    return (
        <StyledModal
            isOpen={isOpen}
            onClose={() => { }}
            title=""
            position="center"
            noClose
            noPadding
            width="896px"
            height='90vh'
        >
            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate" title={ticket.title}>
                            {ticket.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {ticket.id}</p>
                    </div>
                    <div
                        className="cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
                        onClick={onClose}
                    >
                        <IoMdClose className="h-6 w-6 text-[#747474]" />
                    </div>
                </header>

                <div className="flex-grow lg:grid lg:grid-cols-3 lg:gap-x-6 overflow-hidden p-4">
                    <div className="lg:col-span-2 flex flex-col h-full">
                        <div className="flex-grow space-y-4 overflow-y-auto p-2 pr-4 -mr-2">
                            {ticket.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className={`flex items-end gap-3 ${ticket.agent && comment.user_id === ticket.agent.id ? "justify-start" : "justify-end"}`}
                                >
                                    <div
                                        className={`max-w-md p-3 rounded-2xl ${ticket.agent && comment.user_id === ticket.agent.id ? "bg-gray-100 dark:bg-gray-700 rounded-bl-none" : "bg-blue-600 text-white rounded-br-none"}`}
                                    >
                                        <p className="text-sm">{comment.message}</p>
                                        <p
                                            className={`text-xs mt-1.5 text-right ${ticket.agent && comment.user_id === ticket.agent.id ? "text-gray-500 dark:text-gray-400" : "text-blue-200"}`}
                                        >
                                            {formatDate(comment.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={t('ticket.detail.writeResponse')}
                                    rows={2}
                                    className="w-full bg-gray-100 border-gray-300 dark:border-gray-600 rounded-lg outline-none p-3 pr-24 focus:ring-0 resize-none text-sm transition-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="submit"
                                        disabled={isSending || !newMessage.trim()}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <aside className="hidden lg:block bg-gray-50 dark:bg-gray-800/50 border  dark:border-gray-700 rounded-2xl p-4 overflow-y-auto">
                        <h4 className="font-bold mb-4 text-gray-800 dark:text-white">{t('ticket.detail.details')}</h4>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">{t('ticket.detail.status')}</p>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusInfo.class}`}>
                                    <span>{statusInfo.icon}</span>
                                    {statusInfo.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">{t('ticket.detail.priority')}</p>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${priorityInfo.class}`}>
                                    <span>{priorityInfo.icon}</span>
                                    {priorityInfo.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ticket.detail.category')}</p>
                                <div className="mt-1 space-y-1">
                                    {ticket.categories.length > 0 ? (
                                        ticket.categories.map((category) => (
                                            <p key={category.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                                {category.name}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="font-semibold text-gray-900 dark:text-white text-xs">{t('ticket.category.uncategorized')}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ticket.detail.createdAt')}</p>
                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatDate(ticket.created_at)}</p>
                            </div>
                            {ticket.agent && (
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ticket.detail.assignedAgent')}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-xs">{ticket.agent.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs">{ticket.agent.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('ticket.detail.originalDescription')}</p>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 text-xs leading-relaxed">{ticket.description}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </StyledModal>
    )
}

export default ModalDetailTickets