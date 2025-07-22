import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { AnimatedCounter } from './AnimatedCounter';
import { FaClockRotateLeft } from 'react-icons/fa6';
import { useWindowSize } from '@/app/hooks/useWindowSize';

const confettiColors = ['#fc3d6b', '#ff7e5f', '#ffffff', '#ffd700'];

const modalContainerVariants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: { duration: 0.3 },
  },
};

const modalContentVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { when: 'beforeChildren', staggerChildren: 0.08 },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      when: 'afterChildren',
      staggerChildren: 0.06,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, skewX: -5, opacity: 0 },
  visible: {
    y: 0,
    skewX: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 150 },
  },
};

const AnimateGifts = ({
  image_gift,
  minutes,
  name,
}: {
  image_gift: string;
  minutes: number;
  name: string;
}) => {
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      <Confetti
        key="confetti-left"
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={250}
        initialVelocityX={{ min: 5, max: 15 }}
        initialVelocityY={{ min: -15, max: 10 }}
        gravity={0.1}
        confettiSource={{ x: 0, y: height / 2, w: 0, h: 0 }}
        colors={confettiColors}
        className="!fixed !z-[100]"
      />
      <Confetti
        key="confetti-right"
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={250}
        initialVelocityX={{ min: -15, max: -5 }}
        initialVelocityY={{ min: -15, max: 10 }}
        gravity={0.1}
        confettiSource={{ x: width, y: height / 2, w: 0, h: 0 }}
        colors={confettiColors}
        className="!fixed !z-[100]"
      />
      <motion.div
        variants={modalContainerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8"
        style={{
          background:
            'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
        }}
      >
        <motion.div
          variants={modalContentVariants}
          onClick={(e) => e.stopPropagation()}
          className="flex cursor-default flex-col items-center gap-6"
        >
          <motion.img
            layoutId={`gift-image-${image_gift}`}
            src={image_gift}
            alt={image_gift}
            className="h-56 w-56 object-contain drop-shadow-[0_0_15px_rgba(252,61,107,0.4)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(252,61,107,0.6)] sm:h-72 sm:w-72"
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 250,
              mass: 0.7,
            }}
          />
          <motion.div className="text-center">
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-white drop-shadow-md"
            >
              {name}
            </motion.h2>
            <motion.div
              variants={itemVariants}
              className="mt-4 flex items-center justify-center gap-4 text-lg"
            >
              <span className="flex items-center gap-2 text-yellow-400 drop-shadow-sm">
                <FaClockRotateLeft className="h-5 w-5" />
                <AnimatedCounter to={minutes} decimals={2} />
                <span className="ml-1">min</span>
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimateGifts;
