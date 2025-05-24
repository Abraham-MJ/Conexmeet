import { UserInformation } from '@/app/types/streams';

const DEFAULT_SORT_VALUE = 99;
const STATUS_ORDER: { [key: string]: number } = {
  available_call: 1,
  in_call: 2,
  online: 3,
  offline: 4,
};

export function sortOnlineFemales(
  femalesList: UserInformation[],
): UserInformation[] {
  const listToSort = [...femalesList];
  listToSort.sort((a, b) => {
    const statusAValue = a.status
      ? STATUS_ORDER[a.status] || DEFAULT_SORT_VALUE
      : DEFAULT_SORT_VALUE;
    const statusBValue = b.status
      ? STATUS_ORDER[b.status] || DEFAULT_SORT_VALUE
      : DEFAULT_SORT_VALUE;
    return statusAValue - statusBValue;
  });
  return listToSort;
}
