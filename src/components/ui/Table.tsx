import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table({
  headers,
  children,
  empty = false,
  emptyMessage = 'No records found.',
  className = '',
}: TableProps) {
  return (
    <div className={`overflow-x-auto w-full ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#E1E5EB] bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {headers.map((h, i) => (
              <th key={i} className="py-3 px-4 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E1E5EB] bg-white">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="py-10 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
