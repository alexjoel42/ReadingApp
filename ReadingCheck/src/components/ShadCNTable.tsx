// src/components/ShadCNTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ShadCNTable = ({ children }) => (
  <div className="overflow-auto rounded-lg border"> {/* Preserves your container styles */}
    <Table className="[&_td]:px-4 [&_th]:px-4 [&_th]:font-semibold">
      {children}
    </Table>
  </div>
);