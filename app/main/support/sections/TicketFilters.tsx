"use client"

import StyledSelect from "@/app/components/UI/StyledSelect"
import { TicketPriority, TicketStatus } from "@/app/types/tickets"
import { useTranslation } from "@/app/hooks/useTranslation"

interface TicketFiltersProps {
    statusFilter: TicketStatus
    setStatusFilter: (status: TicketStatus) => void
    priorityFilter: TicketPriority
    setPriorityFilter: (priority: TicketPriority) => void
}

export function TicketFilters({
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
}: TicketFiltersProps) {
    const { t } = useTranslation()
    
    return (
        <div className="flex w-full gap-8">
            <div className="w-full">
                <StyledSelect
                    name="status_filter"
                    value={statusFilter}
                    handleChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
                    error={''}
                    label={t('ticket.filters.status')}
                    placeholder={t('ticket.filters.selectStatus')}
                    onFocus={() => { }}
                    itemList={[{
                        id: 'all',
                        label: t('ticket.status.all')
                    }, {
                        id: 'open',
                        label: t('ticket.status.open')
                    }, {
                        id: 'in_progress',
                        label: t('ticket.status.inProgress')
                    }, {
                        id: 'resolved',
                        label: t('ticket.status.resolved')
                    }, {
                        id: 'closed',
                        label: t('ticket.status.closed')
                    }]}
                /></div>

            <div className="w-full">

                <StyledSelect
                    name="priority_filter"
                    value={priorityFilter}
                    handleChange={(e) => setPriorityFilter(e.target.value as TicketPriority)}
                    error={''}
                    label={t('ticket.filters.priority')}
                    placeholder={t('ticket.filters.selectPriority')}
                    onFocus={() => { }}
                    itemList={[{
                        id: 'all',
                        label: t('ticket.priority.all')
                    }, {
                        id: 'low',
                        label: t('ticket.priority.low')
                    }, {
                        id: 'medium',
                        label: t('ticket.priority.medium')
                    }, {
                        id: 'high',
                        label: t('ticket.priority.high')
                    }, {
                        id: 'urgent',
                        label: t('ticket.priority.urgent')
                    }]}
                />
            </div>
        </div>
    )
}
