import React from 'react';

interface GiftContainerProps {
  giftsItems: any;
  sendGift: (
    gifId: string | number,
    giftCostInMinutes: number,
    gift_image: string,
    giftPoints: number,
    giftName: string,
  ) => Promise<
    | { success: boolean; message?: string; cost_in_minutes: number }
    | { success: boolean; message?: string }
  >;
}

export interface GiftItem {
  id: number;
  image: string;
  minutes: number;
  points: number;
  name: string;
}

const GiftContainer: React.FC<GiftContainerProps> = ({
  giftsItems,
  sendGift,
}) => {
  return (
    <>
      <div className="overflow-x-unset custom-scrollbar-hide pointer-events-auto relative m-0 flex max-h-full min-h-0 flex-1 flex-col items-center gap-4 self-end overflow-y-auto p-0">
        {giftsItems.map((gift: GiftItem, i: number) => {
          return (
            <div
              key={i}
              className="pointer-events-auto relative mb-1 ml-0 flex h-[72px] w-14 flex-col items-center justify-center rounded-2xl transition-all duration-300 after:min-w-4 after:content-[''] hover:cursor-pointer hover:bg-[#ffffff1f]"
              onClick={() => {
                sendGift(
                  gift.id,
                  gift.minutes,
                  gift.image,
                  gift.points,
                  gift.name,
                );
              }}
            >
              <img
                src={gift.image}
                className="overflow-clip-margin-box mb-0 h-12 w-12 overflow-clip"
                alt="mos"
              />
              <div className="flex items-center text-[10px] text-white">
                <div className="flex w-full items-center justify-center">
                  {gift.minutes} min
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default GiftContainer;
