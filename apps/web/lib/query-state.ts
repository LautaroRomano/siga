type ListQuery = {
  isPending: boolean;
  isFetching: boolean;
  data: readonly unknown[] | undefined;
};

export const isListLoading = ({ isPending, isFetching, data }: ListQuery) =>
  isPending || (isFetching && (data?.length ?? 0) === 0);
