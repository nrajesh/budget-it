import { Payee } from '@/types/payee';

export interface CustomColumnDef<TData> {
  id: string;
  header: string | ((props: { table: any }) => React.ReactNode);
  cellRenderer?: (item: TData) => React.ReactNode;
  cell?: (props: { row: any }) => React.ReactNode;
}

export const DataTable = <TData extends Payee>({
  columns,
  data,
  // ... other props
}: {
  columns: CustomColumnDef<TData>[];
  data: TData[];
  // ... other props
}) => {
  // ... table implementation
};