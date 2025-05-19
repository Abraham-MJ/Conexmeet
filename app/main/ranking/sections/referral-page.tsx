import React from 'react';
import { StyledTable, type Column } from '@/app/components/UI/StyledTable';
import { formatCustomDate } from '@/app/utils/format-date';

interface ReferralProps {
  data: any[] | null;
  isLoading: boolean;
}

const ReferralPage: React.FC<ReferralProps> = ({ data, isLoading }) => {
  const columns: Column<any>[] = [
    {
      key: 'sender_name',
      header: 'Sender Name',
      align: 'center',
      width: 'w-[100px]',
      cell: (item) => {
        return <div className="flex justify-center">{item.name}</div>;
      },
    },
    {
      key: 'date',
      header: 'Date',
      align: 'center',
      cell: (item) => (
        <span className="font-normal">{formatCustomDate(item.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="w-full xl:w-1/2">
      <StyledTable
        data={data ?? []}
        columns={columns}
        footer={false}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ReferralPage;
