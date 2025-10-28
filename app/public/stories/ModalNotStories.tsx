'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import StyledModal from '@/app/components/UI/StyledModal';
import { useRouter } from 'next/navigation';



const ModalNotStories = ({ isOpen, onClose, lockModal = false }: { isOpen: boolean, onClose: () => void, lockModal?: boolean }) => {
    const router = useRouter();

    const handleRegisterClick = () => {
        if (!lockModal) {
            onClose();
        }
        router.push('/auth/sign-up');
    };

    return (
        <StyledModal
            isOpen={isOpen}
            onClose={lockModal ? () => {} : onClose}
            title=""
            position="center"
            noClose={lockModal}
            noPadding
            width="520px"
        >
            <div
                className={cn(
                    'relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-red-50 shadow-2xl border-0',
                )}
            >
                {!lockModal && (
                    <div
                        className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 p-2 transition-all duration-300 hover:scale-110 hover:bg-white shadow-sm"
                        onClick={onClose}
                    >
                        <IoMdClose className="h-5 w-5 text-gray-600" />
                    </div>
                )}

                <div className="flex flex-col items-center justify-center p-10 text-center">
                    <div className="mb-6 text-6xl">
                        💕
                    </div>

                    <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-[#fc3d6b] to-pink-600 bg-clip-text text-transparent">
                        ¡Descubre Conexiones Increíbles!
                    </h2>

                    <p className="mb-8 max-w-md text-lg text-gray-700 leading-relaxed">
                        ¿Te gustaría conocer chicas fascinantes? ¡Regístrate hoy mismo y obtén minutos gratis como regalo!
                    </p>

                    <button
                        onClick={handleRegisterClick}
                        className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#fc3d6b] to-pink-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
                    >
                        <span className="relative z-10">Registrarse Ahora</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#e63462] to-[#fc3d6b] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    </button>

                    <p className="mt-4 text-sm text-gray-500">
                        ¡Únete gratis y recibe minutos de regalo! 🎁
                    </p>
                </div>
            </div>
        </StyledModal>
    );
};

export default ModalNotStories;
