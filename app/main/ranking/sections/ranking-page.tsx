import React from 'react';
import { StyledTable, type Column } from '@/app/components/UI/StyledTable';
import { RankingItem } from '@/app/types/ranking';
import { useUser } from '@/app/context/useClientContext';
import { converterMinutes } from '@/app/utils/converter-minutes';
import { useTranslation } from '@/app/hooks/useTranslation';

interface RankingProps {
  data: RankingItem[] | null;
  isLoading: boolean;
}

const RankingPage: React.FC<RankingProps> = ({
  data,
  isLoading: isTableDataLoading,
}) => {
  const { t } = useTranslation();
  const { state: userContextState } = useUser();

  const columns: Column<RankingItem>[] = [
    {
      key: 'position',
      header: t('ranking.position'),
      align: 'center',
      width: 'w-[100px]',
      cell: (_item, index) => {
        return (
          <div className="flex items-center justify-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                index + 1 <= 3
                  ? 'bg-gradient-to-br from-[#fc3d6b] to-[#fd7694] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {index + 1}
            </div>
          </div>
        );
      },
    },
    {
      key: 'profile_photo_path',
      header: t('ranking.photo'),
      align: 'center',
      width: 'w-[100px]',
      cell: (item) => (
        <div className="flex justify-center">
          <img
            src={item.profile_photo_path}
            alt={item.name}
            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
          />
        </div>
      ),
    },
    {
      key: 'name',
      header: t('ranking.name'),
      align: 'left',
      cell: (item) => (
        <span className="font-medium text-gray-800">{item.name}</span>
      ),
    },
    {
      key: 'minutes',
      header: t('ranking.minutes'),
      align: 'right',
      highlightColor: true,
      cell: (item) => (
        <span className="font-semibold">+{item.minutes.toFixed(2)}</span>
      ),
    },
  ];

  let dynamicFooterContent: React.ReactNode = (
    <p className="flex items-center text-sm text-gray-500">
      {t('ranking.calculatingPosition')}
    </p>
  );

  if (isTableDataLoading) {
    dynamicFooterContent = (
      <p className="flex items-center text-sm text-gray-500">
        {t('ranking.loadingRanking')}
      </p>
    );
  } else if (
    !userContextState?.user?.id ||
    typeof userContextState.user.minutes !== 'string'
  ) {
    dynamicFooterContent = (
      <p className="flex items-center text-sm text-gray-500">
        {t('ui.userInfoNotAvailable')}
      </p>
    );
  } else {
    const currentUserMinutesNumeric = converterMinutes(
      userContextState.user.minutes,
    );

    if (currentUserMinutesNumeric === null) {
      dynamicFooterContent = (
        <p className="flex items-center text-sm text-red-500">
          {t('ranking.errorProcessingTime')}
        </p>
      );
    } else if (!data || data.length === 0) {
      dynamicFooterContent = (
        <p className="flex items-center text-sm text-gray-500">
          {t('ranking.noRankingData')}
        </p>
      );
    } else {
      const currentUserId = userContextState.user.id;
      const currentUserRankingIndex = data.findIndex(
        (item) => item.id === currentUserId,
      );

      if (currentUserRankingIndex !== -1) {
        const currentUserRank = currentUserRankingIndex + 1;
        const userAbove = data[currentUserRankingIndex - 1];

        if (currentUserRankingIndex === 0) {
          dynamicFooterContent = (
            <p className="flex flex-col text-sm text-gray-700">
              <span className="font-medium">{t('ranking.congratulations')}</span>
              <span className="mx-1 font-bold text-[#fc3d6b]">{t('ranking.number1')}</span>
              <span>{t('ranking.inRanking')}</span>
            </p>
          );
        } else {
          const minutesOfUserAbove = userAbove.minutes;
          let minutesDifference =
            minutesOfUserAbove - currentUserMinutesNumeric;

          if (minutesDifference < 0) {
            dynamicFooterContent = (
              <p className="flex flex-col text-sm">
                <span className="font-medium text-gray-700">
                  {t('ranking.positionUpdating')}
                </span>
                <span className="ml-1 rounded bg-[#fc3d6b] px-1.5 py-0.5 text-xs font-medium text-white">
                  {t('ranking.previousPosition')} #{currentUserRank}
                </span>
              </p>
            );
          } else {
            const pointsNeededToDisplay = (minutesDifference + 0.01).toFixed(2);
            const rankToReach = currentUserRank - 1;

            if (currentUserRank <= 3) {
              dynamicFooterContent = (
                <p className="flex items-center text-sm">
                  <span className="font-medium text-gray-700">
                    {t('ranking.inTop')} {currentUserRank}{t('ranking.needPoints')}
                  </span>
                  <span className="mx-1 font-bold text-[#fc3d6b]">
                    {pointsNeededToDisplay}
                  </span>
                  <span className="text-gray-700">
                    {t('ranking.morePoints')} #{rankToReach}.
                  </span>
                </p>
              );
            } else {
              dynamicFooterContent = (
                <p className="flex flex-col text-sm">
                  <span className="font-medium text-gray-700">{t('ranking.youNeed')}</span>
                  <span className="mx-1 font-bold text-[#fc3d6b]">
                    {pointsNeededToDisplay}
                  </span>
                  <span className="text-gray-700">
                    {t('ranking.morePointsToRise')}
                  </span>
                  <span className="ml-1 rounded bg-[#fc3d6b] px-1.5 py-0.5 text-xs font-medium text-white">
                    #{currentUserRank}
                  </span>
                </p>
              );
            }
          }
        }
      } else {
        const lastUserInList = data[data.length - 1];

        if (currentUserMinutesNumeric > lastUserInList.minutes) {
          dynamicFooterContent = (
            <p className="flex flex-col text-sm">
              <span className="font-medium text-gray-700">
                {t('ranking.youHavePoints')} {currentUserMinutesNumeric.toFixed(2)} {t('ranking.pointsSufficient')}
              </span>
            </p>
          );
        } else {
          let minutesToTieLastInList =
            lastUserInList.minutes - currentUserMinutesNumeric;
          const pointsNeededToDisplay = (minutesToTieLastInList + 0.01).toFixed(
            2,
          );

          dynamicFooterContent = (
            <p className="flex flex-col text-sm">
              <span className="font-medium text-gray-700">
                {t('ranking.youNeed')}{' '}
                <span className="mx-1 font-bold text-[#fc3d6b]">
                  {pointsNeededToDisplay}
                </span>
              </span>

              <span className="text-gray-700">
                {t('ranking.morePointsToEnter')} {data.length} {t('ranking.ofRanking')}
              </span>
              <span className="text-xs text-gray-600">
                {t('ranking.yourPoints')} {currentUserMinutesNumeric.toFixed(2)})
              </span>
            </p>
          );
        }
      }
    }
  }

  return (
    <div className="w-full xl:w-2/3">
      <StyledTable
        data={data ?? []}
        columns={columns}
        footer={dynamicFooterContent}
        isLoading={isTableDataLoading}
      />
    </div>
  );
};

export default RankingPage;
