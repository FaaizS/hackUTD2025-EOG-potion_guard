/**
 * DiscrepancyTable Component
 * 
 * Displays discrepancies between expected (tickets) and actual (calculated) volumes
 * Grouped by date with accordion for better organization
 */

"use client";

import Accordion from "./Accordion";

interface Discrepancy {
  date: string;
  cauldron_id: string;
  cauldron_name: string;
  expected_volume: number;
  actual_volume: number;
  missing_volume: number;
}

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
}

export default function DiscrepancyTable({ discrepancies }: DiscrepancyTableProps) {
  // Group discrepancies by date
  const groupedByDate = discrepancies.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, Discrepancy[]>);

  // Sort dates in ascending order (oldest first)
  const sortedDates = Object.keys(groupedByDate).sort();

  // Create accordion items
  const accordionItems = sortedDates.map(date => {
    const dayData = groupedByDate[date];
    const totalDiscrepancy = dayData.reduce((sum, item) => sum + item.missing_volume, 0);
    const count = dayData.length;

    return {
      value: date,
      trigger: (
        <div className="flex justify-between items-center w-full pr-4">
          <span className="font-bold text-lg">{new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
          <span className="text-sm text-gray-300 ml-4">
            {count} {count === 1 ? 'discrepancy' : 'discrepancies'} found 
            <span className={totalDiscrepancy > 0 ? 'text-red-400 font-bold ml-2' : 'text-gray-300 ml-2'}>
              ({totalDiscrepancy > 0 ? '+' : ''}{totalDiscrepancy.toFixed(2)}L total)
            </span>
          </span>
        </div>
      ),
      content: (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-purple-300/50">
            <thead>
              <tr className="bg-white/20">
                <th className="border border-purple-300/50 p-2">Cauldron</th>
                <th className="border border-purple-300/50 p-2">Expected (L)</th>
                <th className="border border-purple-300/50 p-2">Actual (L)</th>
                <th className="border border-purple-300/50 p-2">Discrepancy (L)</th>
              </tr>
            </thead>
            <tbody>
              {dayData.map((item, idx) => (
                <tr key={idx} className={item.missing_volume > 0 ? "bg-red-900/40" : "bg-yellow-900/40"}>
                  <td className="border border-purple-300/50 p-2">{item.cauldron_name}</td>
                  <td className="border border-purple-300/50 p-2">{item.expected_volume.toFixed(2)}</td>
                  <td className="border border-purple-300/50 p-2">{item.actual_volume.toFixed(2)}</td>
                  <td className={`border border-purple-300/50 p-2 ${item.missing_volume > 0 ? "text-red-400 font-bold" : "text-yellow-400 font-bold"}`}>
                    {item.missing_volume > 0 ? '+' : ''}{item.missing_volume.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    };
  });

  if (accordionItems.length === 0) {
    return (
      <div className="w-full mt-8">
        <h2 className="text-2xl font-bold mb-4">Discrepancy Analysis</h2>
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No data available for this date range</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
        Discrepancy Analysis
        <span className="text-base font-normal text-gray-300 ml-2">
          ({discrepancies.length} total records)
        </span>
      </h2>
      <div className="bg-black/30 backdrop-blur-sm rounded-lg border-2 border-purple-300/50 p-4">
        <Accordion items={accordionItems} defaultOpen={sortedDates[0]} />
      </div>
    </div>
  );
}

