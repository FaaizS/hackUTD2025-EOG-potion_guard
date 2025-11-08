import { getDiscrepancies } from "@/app/lib/apiClient";

export default async function DiscrepancyTable() {
  // TODO(Araohat): Fetch real data from the apiClient
  const discrepancies = await getDiscrepancies();

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
          {discrepancies.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 p-2">{item.date}</td>
              <td className="border border-gray-300 p-2">{item.cauldron}</td>
              <td className="border border-gray-300 p-2">{item.expected}</td>
              <td className="border border-gray-300 p-2">{item.actual}</td>
              <td className="border border-gray-300 p-2">{item.missing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

