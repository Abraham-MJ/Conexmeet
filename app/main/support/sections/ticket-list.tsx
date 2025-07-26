"use client"

import { MessageSquare, Calendar, } from "lucide-react"
import { Ticket } from "@/app/types/tickets"
import { useTranslation } from "@/app/hooks/useTranslation"

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

interface TicketListProps {
    tickets: Ticket[]
    onViewTicket: (ticket: Ticket) => void
}

const formatDate = (dateString: string, t: (key: string, params?: any) => string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return t('time.lessThanHour')
    if (diffInHours < 24) return t('time.hoursAgo', { hours: diffInHours })
    if (diffInHours < 48) return t('time.oneDayAgo')

    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
}

export function TicketList({ tickets, onViewTicket }: TicketListProps) {
    const { t } = useTranslation()
    const priorityConfig = getPriorityConfig(t)
    const statusConfig = getStatusConfig(t)
    
    if (tickets.length === 0) {
        return (
            <div className="text-center py-20 px-6 mt-10">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('support.noTickets')}</h3>
                <p className="text-gray-500">{t('support.noTicketsDescription')}</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 mt-10 pb-10">
            {tickets.map((ticket) => {
                const priorityInfo = priorityConfig[ticket.priority]
                const statusInfo = statusConfig[ticket.status]

                return (
                    <div
                        key={ticket.id}
                        className="group bg-white rounded-2xl shadow-sm hover:shadow-lg p-6 space-y-4 cursor-pointer transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                        onClick={() => onViewTicket(ticket)}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
                                    {ticket.title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {ticket.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${priorityInfo.class}`}>
                                <span>{priorityInfo.icon}</span>
                                {priorityInfo.label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusInfo.class}`}>
                                <span>{statusInfo.icon}</span>
                                {statusInfo.label}
                            </span>
                        </div>

                        {ticket.categories && ticket.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {ticket.categories.slice(0, 2).map((category) => (
                                    <span
                                        key={category.id}
                                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                                    >
                                        {category.name}
                                    </span>
                                ))}
                                {ticket.categories.length > 2 && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                        +{ticket.categories.length - 2} {t('support.moreCategories')}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(ticket.created_at, t)}
                                </div>
                                {ticket.comments && ticket.comments.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        {ticket.comments.length}
                                    </div>
                                )}
                            </div>

                            {ticket.agent && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-white">
                                            {ticket.agent.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">
                                        {ticket.agent.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
