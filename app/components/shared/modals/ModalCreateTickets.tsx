import React, { FormEvent, useState } from 'react'
import { motion } from 'framer-motion';
import StyledModal from '../../UI/StyledModal'
import { IoMdClose } from 'react-icons/io'
import { CreateTicketRequest } from '@/app/types/tickets'
import { useForm } from '@/app/hooks/useForm'
import StyledInputs from '../../UI/StyledInputs'
import StyledSelect from '../../UI/StyledSelect'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/app/hooks/useTranslation'

interface ModalDetailTicketsProps {
    isOpen: boolean
    onClose: () => void
    onCreateTicket: (ticket: CreateTicketRequest) => void
}

const ModalCreateTickets: React.FC<ModalDetailTicketsProps> = ({ isOpen, onClose, onCreateTicket }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { t } = useTranslation()
    const { credentials, errors, changeField, clearError, setCredentials } =
        useForm<CreateTicketRequest>({
            title: '',
            priority: 'low',
            description: '',
            category: ''
        });


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        if (!credentials.title.trim() || !credentials.description.trim() || !credentials.priority || !credentials.category) {
            alert(t('ticket.create.requiredFields'));
            return;
        }

        try {
            setIsLoading(true)
            await onCreateTicket(credentials)
            setCredentials({
                title: '',
                priority: 'low',
                description: '',
                category: ''
            });
            onClose()
        } catch (error) {
            console.error('Error al crear ticket:', error);
            alert(t('ticket.create.error'));
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <StyledModal
            isOpen={isOpen}
            onClose={() => { }}
            title=""
            position="center"
            noClose
            noPadding
            width="550px"
            height='650px'
        >
            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full h-full flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-end p-4 border-b border-gray-200 flex-shrink-0">
                    <div
                        className="cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
                        onClick={onClose}
                    >
                        <IoMdClose className="h-6 w-6 text-[#747474]" />
                    </div>
                </header>


                <div className="p-6 space-y-6">
                    <StyledInputs
                        name="title"
                        type="text"
                        value={credentials.title}
                        handleChange={changeField}
                        error={errors.title}
                        label={t('ticket.create.titleField')}
                        placeholder={t('ticket.create.titlePlaceholder')}
                        onFocus={() => clearError('title')}
                    />
                    <StyledSelect
                        name="priority"
                        value={credentials.priority}
                        handleChange={changeField}
                        error={errors.priority}
                        label={t('ticket.create.priority')}
                        placeholder={t('ticket.create.priorityPlaceholder')}
                        onFocus={() => clearError('priority')}
                        itemList={[
                            { id: 'low', label: t('ticket.priority.low') }, 
                            { id: 'medium', label: t('ticket.priority.medium') }, 
                            { id: 'high', label: t('ticket.priority.high') }
                        ]}
                    />
                    <StyledSelect
                        name="category"
                        value={credentials.category}
                        handleChange={changeField}
                        error={errors.category}
                        label={t('ticket.create.category')}
                        placeholder={t('ticket.create.categoryPlaceholder')}
                        onFocus={() => clearError('category')}
                        itemList={[{
                            "id": '1',
                            "label": t('ticket.category.uncategorized'),
                        },
                        {
                            "id": '2',
                            "label": t('ticket.category.payment'),
                        },
                        {
                            "id": '3',
                            "label": t('ticket.category.profile'),
                        },
                        {
                            "id": '4',
                            "label": t('ticket.category.shipping'),
                        },
                        {
                            "id": '5',
                            "label": t('ticket.category.videoChat'),
                        },
                        {
                            "id": '6',
                            "label": t('ticket.category.connection'),
                        }]}
                    />
                    <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            {t('ticket.create.description')}
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={credentials.description}
                            onChange={(e) => {
                                setCredentials({
                                    ...credentials,
                                    description: e.target.value
                                });
                            }}
                            onFocus={() => clearError('description')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder={t('ticket.create.descriptionPlaceholder')}
                            required
                        ></textarea>
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-end p-6 space-x-3 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                    <Button
                        className={
                            'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300'
                        }
                        disabled={isLoading}
                        onClick={handleSubmit}
                    >
                        {isLoading ? (
                            <div className="text-md flex items-center justify-center font-latosans">
                                {t('ticket.create.sending')}
                                {[1, 2, 3].map((index) => {
                                    return (
                                        <motion.span
                                            key={index}
                                            animate={{ opacity: [0, 1, 1, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            .
                                        </motion.span>
                                    );
                                })}
                            </div>
                        ) : (
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {t('ticket.create.submit')}
                            </span>
                        )}
                    </Button>
                </div>

            </div>
        </StyledModal>
    )
}

export default ModalCreateTickets