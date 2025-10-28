'use client';

import FeaturesSkeleton from "@/app/components/loading/features-skeleton";
import { ContentCardStories } from "@/app/components/shared/features/ContentCard";
import ContainerGlobal from "@/app/components/shared/global/ContainerGlobal";
import useFeatures from "@/app/hooks/api/useFeatures";
import { useTranslation } from "@/app/hooks/useTranslation";
import { HistoryData } from "@/app/types/histories";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ModalStories from "@/app/components/shared/modals/ModalStories";
import ModalNotStories from "./ModalNotStories";
import { useRouter } from 'next/navigation';

const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

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

interface StoriesComponentProps {
    storyId?: string;
}

const StoriesComponent = ({ storyId }: StoriesComponentProps) => {
    const { t } = useTranslation();
    const router = useRouter();

    const {
        stories,
        onSetPlayingVideoUrl,
        activeVideoUrl,
    } = useFeatures({ activeTabs: 'stories' });

    const [autoModalOpen, setAutoModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<HistoryData | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const getViewedStoriesCount = () => {
        if (typeof window !== 'undefined') {
            const count = localStorage.getItem('viewedStoriesCount');
            return count ? parseInt(count, 10) : 0;
        }
        return 0;
    };

    const incrementViewedStories = () => {
        if (typeof window !== 'undefined') {
            const currentCount = getViewedStoriesCount();
            const newCount = currentCount + 1;
            localStorage.setItem('viewedStoriesCount', newCount.toString());
            return newCount;
        }
        return 0;
    };

    const handleStoryChange = () => {
        const currentCount = getViewedStoriesCount();
        const newCount = currentCount + 1;

        if (newCount > 3) {
            setAutoModalOpen(false);
            setSelectedStory(null);
            setShowLimitModal(true);
            return false;
        } else {
            incrementViewedStories();
            return true;
        }
    };

    useEffect(() => {
        if (stories.data && stories.data.length > 0 && !stories.loading) {
            const currentCount = getViewedStoriesCount();
            
            if (currentCount >= 3) {
                setShowLimitModal(true);
                return;
            }

            let storyToShow;

            if (storyId) {
                storyToShow = stories.data.find(s => s.id.toString() === storyId);
                
                if (!storyToShow) {
                    storyToShow = stories.data[0];
                }
            } else {
                const randomIndex = Math.floor(Math.random() * stories.data.length);
                storyToShow = stories.data[randomIndex];
                router.replace(`/public/stories/${storyToShow.id}`);
                return;
            }

            if (currentCount === 0) {
                incrementViewedStories();
            }

            setSelectedStory(storyToShow);
            setAutoModalOpen(true);
        }
    }, [storyId, stories.data, stories.loading, router]);

    return (
        <ContainerGlobal classNames="max-w-[1536px] px-4 mx-auto">
            <div>
                <h2 className="mb-8 text-xl font-medium text-gray-800">
                    {t('features.stories')}
                </h2>
                {stories.loading ? (
                    <FeaturesSkeleton />
                ) : (
                    <motion.div
                        className="relative grid grid-flow-dense auto-rows-min grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                        variants={gridContainerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {stories?.data?.map((user: HistoryData) => (
                            <motion.div
                                key={`story-${user.id}`}
                                variants={cardItemVariants}
                            >
                                <ContentCardStories
                                    activeVideoUrl={activeVideoUrl}
                                    onSetPlayingVideoUrl={onSetPlayingVideoUrl}
                                    user={user}
                                    stories={stories.data ?? []}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {selectedStory && stories.data && (
                <ModalStories
                    isOpen={autoModalOpen}
                    onClose={() => {
                        if (!storyId) {
                            setAutoModalOpen(false);
                            setSelectedStory(null);
                        }
                    }}
                    stories={stories.data}
                    active_stories={selectedStory}
                    lockToStory={!!storyId}
                    onStoryChange={handleStoryChange}
                    messages={true}
                />
            )}

            {showLimitModal && (
                <ModalNotStories
                    isOpen={showLimitModal}
                    onClose={() => { }}
                    lockModal={true}
                />
            )}
        </ContainerGlobal>
    );
};

export default StoriesComponent;