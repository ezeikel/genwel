import InsightCard from './InsightCard';

interface Insight {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

interface InsightsListProps {
  insights: Insight[];
}

export default function InsightsList({ insights }: InsightsListProps) {
  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <InsightCard key={insight.id} {...insight} />
      ))}
    </div>
  );
}
