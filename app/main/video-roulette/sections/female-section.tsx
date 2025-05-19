'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, Video } from 'lucide-react';
import { useUser } from '@/app/context/useClientContext';
import { useVideoRouletteFemale } from '@/app/hooks/api/useVideoRouletteFemale';
import PlayStoriesView from './play-stories';
import AddStoriesView from './add-stories';

const FemaleViewVideo = () => {
  const { state: user } = useUser();
  const { histories, deleteHistoryById, isLoadingDelete } =
    useVideoRouletteFemale();

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
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#fc3d6b] via-[#fc3d6b] to-[#fc3d6b] opacity-70 blur-sm transition duration-1000 group-hover:opacity-100 group-hover:blur-md"></div>
                <div className="animate-spin-slow absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#fc3d6b] via-[#fc3d6b] to-[#fc3d6b] opacity-50 blur-[1px]"></div>
                <div className="relative h-40 w-40 overflow-hidden rounded-full bg-white p-1 md:h-48 md:w-48">
                  <div className="h-full w-full overflow-hidden rounded-full">
                    <img
                      src={
                        user.user.profile_photo_path ??
                        '/images/banner-female.png'
                      }
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
                disabled={false}
                onClick={() => {}}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Video
                    className={cn('h-5 w-5 transition-transform duration-300')}
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
              {histories.length > 0 ? (
                <PlayStoriesView
                  histories={histories}
                  onDelete={(storie_id) => {}}
                  isLoadingDelete={isLoadingDelete}
                />
              ) : (
                <AddStoriesView />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FemaleViewVideo;
