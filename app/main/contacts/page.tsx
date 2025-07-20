'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ContactData } from '@/app/types/my-contacts';
import useFeatures from '@/app/hooks/api/useFeatures';
import FeaturesSkeleton from '@/app/components/loading/features-skeleton';
import { ContentCardContacts } from '@/app/components/shared/features/ContentCard';
import ContainerGlobal from '@/app/components/shared/global/ContainerGlobal';

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

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const ContactsScreen = () => {
  const { contacts } = useFeatures({ activeTabs: 'contacts' });

  return (
    <ContainerGlobal classNames="max-w-[1536px] px-4 mx-auto">
      <div className="mt-6 pb-12 md:px-0">
        <h2 className="mb-8 text-xl font-medium text-gray-800">
          Your contacts
        </h2>
        {contacts.loading ? (
          <FeaturesSkeleton />
        ) : (
          <motion.div
            className="relative grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {contacts?.data?.map((user: ContactData) => (
              <motion.div
                key={`contact-${user.id}`}
                variants={cardItemVariants}
              >
                <ContentCardContacts user={user} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </ContainerGlobal>
  );
};

export default ContactsScreen;
