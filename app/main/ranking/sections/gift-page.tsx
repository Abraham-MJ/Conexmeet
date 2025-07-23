import React from 'react';
import { StyledTable, type Column } from '@/app/components/UI/StyledTable';
import { formatCustomDate } from '@/app/utils/format-date';

interface GiftProps {
  data: any[] | null;
  isLoading: boolean;
}

const GiftPage: React.FC<GiftProps> = ({ data, isLoading }) => {
  const columns: Column<any>[] = [
    {
      key: 'sender_name',
      header: 'Nombre del Remitente',
      align: 'center',
      width: 'w-[100px]',
      cell: (item) => {
        return <div className="flex justify-center">{item.sender_name}</div>;
      },
    },
    {
      key: 'gift_name',
      header: 'Nombre del Regalo',
      align: 'center',
      cell: (item) => (
        <span className="font-normal text-gray-800">{item.gif_name}</span>
      ),
    },
    {
      key: 'points',
      header: 'Puntos',
      align: 'center',
      highlightColor: true,
      cell: (item) => <span className="font-semibold">+{item.points}</span>,
    },
    {
      key: 'date',
      header: 'Fecha',
      align: 'center',
      cell: (item) => (
        <span className="font-normal">{formatCustomDate(item.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="w-full xl:w-2/3">
      <StyledTable
        data={data ?? []}
        columns={columns}
        footer={false}
        isLoading={isLoading}
      />
    </div>
  );
};

export default GiftPage;
