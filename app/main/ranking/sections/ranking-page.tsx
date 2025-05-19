import React from 'react';
import { StyledTable, type Column } from '@/app/components/UI/StyledTable';
import { RankingItem } from '@/app/types/ranking';
import { useUser } from '@/app/context/useClientContext';
import { converterMinutes } from '@/app/utils/converter-minutes';

interface RankingProps {
  data: RankingItem[] | null;
  isLoading: boolean;
}

const RankingPage: React.FC<RankingProps> = ({
  data,
  isLoading: isTableDataLoading,
}) => {
  const { state: userContextState } = useUser();

  const columns: Column<RankingItem>[] = [
    {
      key: 'position',
      header: 'Position',
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
      header: 'Photo',
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
      header: 'Name',
      align: 'left',
      cell: (item) => (
        <span className="font-medium text-gray-800">{item.name}</span>
      ),
    },
    {
      key: 'minutes',
      header: 'Minutes',
      align: 'right',
      highlightColor: true,
      cell: (item) => (
        <span className="font-semibold">+{item.minutes.toFixed(2)}</span>
      ),
    },
  ];

  let dynamicFooterContent: React.ReactNode = (
    <p className="flex items-center text-sm text-gray-500">
      Calculating your position...
    </p>
  );

  if (isTableDataLoading) {
    dynamicFooterContent = (
      <p className="flex items-center text-sm text-gray-500">
        Loading ranking...
      </p>
    );
  } else if (
    !userContextState?.user?.id ||
    typeof userContextState.user.minutes !== 'string'
  ) {
    dynamicFooterContent = (
      <p className="flex items-center text-sm text-gray-500">
        User information not available.
      </p>
    );
  } else {
    const currentUserMinutesNumeric = converterMinutes(
      userContextState.user.minutes,
    );

    if (currentUserMinutesNumeric === null) {
      dynamicFooterContent = (
        <p className="flex items-center text-sm text-red-500">
          Error processing your time.
        </p>
      );
    } else if (!data || data.length === 0) {
      dynamicFooterContent = (
        <p className="flex items-center text-sm text-gray-500">
          No ranking data available.
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
            <p className="flex items-center text-sm text-gray-700">
              <span className="font-medium">Congratulations! You are</span>
              <span className="mx-1 font-bold text-[#fc3d6b]">#1</span>
              <span>in the rankings. Keep it up!</span>
            </p>
          );
        } else {
          const minutesOfUserAbove = userAbove.minutes;
          let minutesDifference =
            minutesOfUserAbove - currentUserMinutesNumeric;

          if (minutesDifference < 0) {
            dynamicFooterContent = (
              <p className="flex items-center text-sm">
                <span className="font-medium text-gray-700">
                  Your ranking position is updating!
                </span>
                <span className="ml-1 rounded bg-[#fc3d6b] px-1.5 py-0.5 text-xs font-medium text-white">
                  Prev. Rank: #{currentUserRank}
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
                    You're in the Top {currentUserRank}! Need
                  </span>
                  <span className="mx-1 font-bold text-[#fc3d6b]">
                    {pointsNeededToDisplay}
                  </span>
                  <span className="text-gray-700">
                    more points to reach #{rankToReach}.
                  </span>
                </p>
              );
            } else {
              dynamicFooterContent = (
                <p className="flex items-center text-sm">
                  <span className="font-medium text-gray-700">You: Need</span>
                  <span className="mx-1 font-bold text-[#fc3d6b]">
                    {pointsNeededToDisplay}
                  </span>
                  <span className="text-gray-700">
                    More points to move up the rankings.
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
            <p className="flex items-center text-sm">
              <span className="font-medium text-gray-700">
                You have {currentUserMinutesNumeric.toFixed(2)} points. Enough
                to enter this top list! Updating...
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
            <p className="flex items-center text-sm">
              <span className="font-medium text-gray-700">You: Need</span>
              <span className="mx-1 font-bold text-[#fc3d6b]">
                {pointsNeededToDisplay}
              </span>
              <span className="text-gray-700">
                More points to enter the top {data.length} rankings.
              </span>
              <span className="ml-2 text-xs text-gray-600">
                (Your points: {currentUserMinutesNumeric.toFixed(2)})
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
