/**
 * DiscrepancyTable Component
 * 
 * Displays discrepancies between expected (tickets) and actual (calculated) volumes
 * Highlights rows with missing volume (potential theft) in red
 */

import { getDiscrepancies } from "@/app/lib/apiClient";

interface Discrepancy {
  date: string;
  cauldron_id: string;
  cauldron_name: string;
  expected_volume: number;
  actual_volume: number;
  missing_volume: number;
}

export default async function DiscrepancyTable() {
  const discrepancies: Discrepancy[] = await getDiscrepancies();

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold mb-4">Discrepancy Table</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Date</th>
            <th className="border border-gray-300 p-2">Cauldron</th>
            <th className="border border-gray-300 p-2">Expected (L)</th>
            <th className="border border-gray-300 p-2">Actual (L)</th>
            <th className="border border-gray-300 p-2">Missing (L)</th>
          </tr>
        </thead>
        <tbody>
          {discrepancies.map((item: Discrepancy, idx: number) => (
            <tr key={idx} className={item.missing_volume > 0 ? "bg-red-50" : ""}>
              <td className="border border-gray-300 p-2">{item.date}</td>
              <td className="border border-gray-300 p-2">{item.cauldron_name}</td>
              <td className="border border-gray-300 p-2">{item.expected_volume}</td>
              <td className="border border-gray-300 p-2">{item.actual_volume}</td>
              <td className={`border border-gray-300 p-2 ${item.missing_volume > 0 ? "text-red-600 font-bold" : ""}`}>
                {item.missing_volume}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

