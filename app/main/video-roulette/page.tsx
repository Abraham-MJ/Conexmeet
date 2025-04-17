'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, Play, Video, X } from 'lucide-react';
import Image from 'next/image';
import { FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useUser } from '@/app/context/useClientContext';
import { getHistories } from './utils';
import { History } from '@/app/types/histories';

export default function VideoRoulettePage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState('');
  const [histories, setHistories] = useState<History[]>([]);

  const { state } = useUser();

  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
      const day = now.getDate().toString().padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${ampm} ${hours}:${minutes} ${month}, ${day} ${year}`);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const historiesFemales = async () => {
      const histories = await getHistories();
      setHistories(histories);
      console.log('histories:', histories);
    };
    historiesFemales();
  }, []);

  const handleVideoChat = async () => {
    const gender = state.user.gender;

    if (gender === 'male') {
    } else if (gender === 'female') {
    }
  };

  const UserMaleContent = () => {
    return (
      <div className="relative flex h-full items-center justify-center">
        <img
          src="https://app.conexmeet.live/storage/photos/xsDEQpbBIvYS2HQIBqnW1wRbI5rU2hisPJQtX83h.jpg"
          alt="blur-img"
          className="relative z-10 h-full w-full object-fill blur-lg"
        />
        <div className="absolute inset-0 z-20 bg-black/80"></div>
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <video
            src="https://app.conexmeet.live/storage/videos/uE9tOPcmmGgEWZm1BRbsvtgujdD9Zr26qtjhqEee.mp4"
            autoPlay
            controlsList="nodownload"
            className="h-full w-[45%] object-cover"
            preload="none"
          ></video>
        </div>
        <div className="absolute left-6 top-6 z-20 h-10 w-10 border-l-2 border-t-2 border-white/50"></div>
        <div className="absolute right-6 top-6 z-20 h-10 w-10 border-r-2 border-t-2 border-white/50"></div>
        <div className="absolute bottom-6 left-6 z-20 h-10 w-10 border-b-2 border-l-2 border-white/50"></div>
        <div className="absolute bottom-6 right-6 z-20 h-10 w-10 border-b-2 border-r-2 border-white/50"></div>
        <div className="absolute left-9 top-9 z-20 text-sm text-white/70">
          <div className="flex items-center">
            <Play className="mr-2 h-4 w-4 text-white/70" />
            <span>PLAY</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-red-500">●</span>
            <span>REC</span>
          </div>
        </div>
        <div className="absolute bottom-8 left-8 z-20 text-sm text-white/70">
          {currentDate}
        </div>
        <div className="absolute">
          <div className="relative z-20 w-full max-w-md px-4 py-16 text-center">
            <h1 className="mb-2 text-4xl font-bold text-white">
              El video chat
            </h1>
            <h2 className="mb-10 text-3xl font-bold text-white">
              con mujeres número 1
            </h2>

            <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-4 text-lg font-medium text-white transition-all hover:bg-blue-700">
              <Video className="h-5 w-5" />
              Entrar al video chat
            </button>

            <p className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Camera className="h-4 w-4" />
              Activa tu cámara para empezar la búsqueda
            </p>
          </div>
        </div>
      </div>
    );
  };

  const UserFemaleContent = () => {
    return (
      <div className="relative h-full">
        <div className="flex h-full flex-col md:flex-row">
          <div className="relative h-full flex-1">
            <div className="flex h-full flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="my-14 flex w-full justify-center"
              >
                <div className="group relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-70 blur-sm transition duration-1000 group-hover:opacity-100 group-hover:blur-md"></div>

                  <div className="animate-spin-slow absolute -inset-0.5 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 opacity-50 blur-[1px]"></div>

                  <div className="relative h-40 w-40 overflow-hidden rounded-full bg-white p-1 md:h-48 md:w-48">
                    <div className="h-full w-full overflow-hidden rounded-full">
                      <Image
                        src="/images/banner-female.png"
                        alt="Profile"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-green-400"></div>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-5 text-center text-3xl font-bold text-gray-800"
              >
                I want to find guys to chat with.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full max-w-md"
              >
                <Button
                  className={cn(
                    'w-full rounded-xl bg-[#de2c7c] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
                  )}
                  disabled={isLoading}
                  onClick={handleVideoChat}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Video
                      className={cn(
                        'h-5 w-5 transition-transform duration-300',
                      )}
                    />
                    Video chat
                  </span>
                </Button>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm font-light text-gray-500">
                  <Camera className="h-4 w-4" />
                  <span>Activate your camera to start searching.</span>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-full w-full md:w-1/3"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full p-2">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200"></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-full w-full">
                      <Image
                        src="/placeholder.svg?height=400&width=300"
                        alt="Video preview"
                        width={300}
                        height={400}
                        className="h-full w-full object-cover opacity-90 transition duration-300 hover:opacity-100"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition duration-300 hover:opacity-100"></div>

                      <div className="absolute bottom-0 left-0 right-0 flex justify-between p-3">
                        <div className="flex gap-2">
                          <button className="rounded-full bg-white/90 p-2 text-gray-600 shadow-md transition duration-300 hover:bg-white hover:text-pink-500">
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <button className="rounded-full bg-white/90 p-2 text-gray-600 shadow-md transition duration-300 hover:bg-white hover:text-pink-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-0 top-0 flex items-center justify-between p-3">
                    <div className="flex gap-1 rounded-full bg-black/20 px-2 py-1 text-xs font-medium text-white">
                      Likes 210
                      <FaHeart className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100%-64px)] w-full items-center justify-center">
      <div
        className={cn(
          'relative h-[80%] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0px_20px_46px_0px_#B1B1B1]',
        )}
      >
        {state?.user?.gender === 'female' && <UserFemaleContent />}
        {state?.user?.gender === 'male' && <UserMaleContent />}
      </div>
    </div>
  );
}
