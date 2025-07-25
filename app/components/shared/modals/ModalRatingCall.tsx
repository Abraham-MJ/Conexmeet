'use client';

import React, { useState } from 'react';
import StyledModal from '../../UI/StyledModal';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useTranslation } from '@/app/hooks/useTranslation';

const ModalRatingCall = () => {
  const { t } = useTranslation();
  const {
    showMaleRatingModal,
    maleRatingInfo,
    closeMaleRatingModal,
    submitMaleRating,
  } = useAgoraContext();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await submitMaleRating(rating, comment);
      setRating(0);
      setHover(0);
      setComment('');
    } catch (error) {
      console.error('Error al enviar calificación:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StyledModal
      isOpen={showMaleRatingModal}
      onClose={closeMaleRatingModal}
      title=""
      position="center"
      noClose
      noPadding
      width="600px"
    >
      <div
        className={
          'relative h-full w-full overflow-hidden rounded-2xl bg-white px-4 py-8 shadow-xl'
        }
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('modal.rating.title')}
          </h2>
          <p className="text-gray-500">
            {maleRatingInfo?.femaleName
              ? `${t('modal.rating.experienceWith')} ${maleRatingInfo.femaleName}?`
              : t('modal.rating.description')}
          </p>
        </div>

        <div
          className="my-8 flex justify-center gap-4"
          onMouseLeave={() => setHover(0)}
        >
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <button
                type="button"
                key={starValue}
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHover(starValue)}
                className="transform transition-transform duration-150 hover:scale-110 focus:outline-none"
                aria-label={`${t('modal.rating.rateStars')} ${starValue} ${t('modal.rating.stars')}`}
              >
                <Star
                  className={`h-12 w-12 transition-colors duration-200 ${
                    starValue <= (hover || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="comment"
            className="text-sm font-medium text-gray-600"
          >
            {t('modal.rating.comments')}
          </label>
          <textarea
            id="comment"
            placeholder={t('modal.rating.commentsPlaceholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-3 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="mt-8 space-y-3">
          <Button
            onClick={handleSubmit}
            className={
              'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80'
            }
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? t('modal.rating.sending') : t('modal.rating.submit')}
          </Button>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalRatingCall;
