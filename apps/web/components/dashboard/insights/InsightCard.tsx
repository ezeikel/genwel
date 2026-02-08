import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faTriangleExclamation,
  faPiggyBank,
  faLightbulb,
} from "@fortawesome/pro-light-svg-icons";
import { Badge } from "@/components/ui/badge";

interface InsightCardProps {
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

const typeConfig: Record<
  string,
  { icon: typeof faArrowTrendUp; color: string; label: string }
> = {
  spending_trend: {
    icon: faArrowTrendUp,
    color: "bg-blue-100 text-blue-600",
    label: "Trend",
  },
  anomaly: {
    icon: faTriangleExclamation,
    color: "bg-amber-100 text-amber-600",
    label: "Unusual",
  },
  saving_tip: {
    icon: faPiggyBank,
    color: "bg-green-100 text-green-600",
    label: "Saving Tip",
  },
  budget_suggestion: {
    icon: faLightbulb,
    color: "bg-violet-100 text-violet-600",
    label: "Suggestion",
  },
};

export default function InsightCard({
  type,
  title,
  body,
  read,
  createdAt,
}: InsightCardProps) {
  const config = typeConfig[type] || typeConfig.spending_trend;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}
        >
          <FontAwesomeIcon icon={config.icon} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {!read && (
              <Badge variant="default" className="text-xs">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
          <p className="text-xs text-gray-400 mt-2">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
