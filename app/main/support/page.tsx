"use client"

import { useState } from "react"

import ContainerGlobal from "@/app/components/shared/global/ContainerGlobal";
import { Button } from "@/components/ui/button";
import { TicketList } from "./sections/ticket-list";
import { TicketFilters } from "./sections/TicketFilters";
import { useTickets } from "@/app/hooks/api/useTickets";
import { TicketPriority, TicketStatus, CreateTicketRequest } from "@/app/types/tickets";
import ModalDetailTickets from "@/app/components/shared/modals/ModalDetailTickets";
import ModalCreateTickets from "@/app/components/shared/modals/ModalCreateTickets";
import { useTranslation } from "@/app/hooks/useTranslation";

const SupportScreen = () => {
    const [statusFilter, setStatusFilter] = useState<TicketStatus>("all")
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority>("all")
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
    const [isOpenCreate, setIsOpenCreate] = useState<boolean>(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { tickets, createTicket, refreshTickets } = useTickets()
    const { t } = useTranslation()

    const filteredTickets = (tickets || []).filter((ticket) => {
        const statusMatch = statusFilter === "all" || ticket.status === statusFilter
        const priorityMatch = priorityFilter === "all" || ticket.priority === priorityFilter
        return statusMatch && priorityMatch
    })

    return (
        <ContainerGlobal classNames="max-w-[1800px] px-4 mx-auto">
            <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800">{t('support.title')}</h1>
                        <p className="text-md text-gray-500  mt-1">
                            {t('support.subtitle')}
                        </p>
                    </div>
                    <Button
                        className='rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80'
                        onClick={() => setIsOpenCreate(true)}
                    >
                        {t('support.createTicket')}
                    </Button>
                </header>

                <main className="mt-16">
                    <TicketFilters
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        priorityFilter={priorityFilter}
                        setPriorityFilter={setPriorityFilter}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-10">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{t('support.stats.total')}</p>
                                    <p className="text-2xl font-bold text-gray-900">{tickets?.length || 0}</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600">📊</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{t('support.stats.open')}</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {tickets?.filter(t => t.status === 'open').length || 0}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600">🔓</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{t('support.stats.inProgress')}</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {tickets?.filter(t => t.status === 'in_progress').length || 0}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span className="text-purple-600">⏳</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{t('support.stats.urgent')}</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {tickets?.filter(t => t.priority === 'urgent').length || 0}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-red-600">🔥</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TicketList
                        tickets={filteredTickets}
                        onViewTicket={(ticket) => {
                            setSelectedTicketId(ticket.id)
                            setIsModalOpen(true)
                        }}
                    />
                </main>
            </div>

            <ModalCreateTickets
                isOpen={isOpenCreate}
                onClose={() => {
                    setIsOpenCreate(false)
                }}
                onCreateTicket={async (ticketData: CreateTicketRequest) => {
                    try {
                        await createTicket(ticketData);
                        setIsOpenCreate(false);
                        console.log('Ticket creado exitosamente');
                        await refreshTickets();
                    } catch (error) {
                        console.error('Error al crear ticket:', error);
                    }
                }}
            />

            <ModalDetailTickets
                ticketId={selectedTicketId}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedTicketId(null)
                }}
            />
        </ContainerGlobal>

    )
}

export default SupportScreen