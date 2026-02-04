"use client";

interface SpendingChartProps {
  data: {
    category: string;
    amount: number;
  }[];
}

const categoryColors: Record<string, string> = {
  Shopping: "#9333ea",
  Bills: "#2563eb",
  Transfer: "#6b7280",
  Cash: "#22c55e",
  Income: "#10b981",
  Fees: "#ef4444",
  Other: "#9ca3af",
};

export default function SpendingChart({ data }: SpendingChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-4">
        {/* Simple bar chart */}
        <div className="flex-1 min-w-[200px]">
          <div className="space-y-3">
            {data.slice(0, 6).map((item) => {
              const percentage = (item.amount / total) * 100;
              const color = categoryColors[item.category] || "#9ca3af";

              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                      }).format(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="w-full md:w-48 flex flex-col justify-center items-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
            }).format(total)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
