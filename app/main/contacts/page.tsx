'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ContactData } from '@/app/types/my-contacts';
import useFeatures from '@/app/hooks/api/useFeatures';
import FeaturesSkeleton from '@/app/components/loading/features-skeleton';
import { ContentCardContacts } from '@/app/components/shared/features/ContentCard';

const cardItemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const ContactsScreen = () => {
  const { contacts } = useFeatures({ activeTabs: 'contacts' });

  return (
    <div className="py-8">
      <h2 className="mb-8 text-xl font-medium text-gray-800">Your contacts</h2>
      {contacts.loading ? (
        <FeaturesSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {contacts?.data?.map((user: ContactData) => (
            <motion.div key={`contact-${user.id}`} variants={cardItemVariants}>
              <ContentCardContacts user={user} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ContactsScreen;
