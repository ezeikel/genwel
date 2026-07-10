import {
  faArrowTrendUp,
  faCircleCheck,
  faLayerGroup,
  faSterlingSign,
  faTriangleExclamation,
} from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getFixableProblems } from '@/actions/fixable-problems';
import { formatCurrency } from '@/lib/budget-utils';

const kindConfig = {
  duplicate_subscription: {
    icon: faLayerGroup,
    color: 'bg-purple-100 text-purple-600',
  },
  price_increase: {
    icon: faArrowTrendUp,
    color: 'bg-amber-100 text-amber-600',
  },
  over_budget: {
    icon: faTriangleExclamation,
    color: 'bg-red-100 text-red-600',
  },
} as const;

const severityBadge = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
} as const;

/**
 * Server component: the Genwel wedge card. Surfaces ranked "fixable problems"
 * (duplicate subs, price rises, overspend) with conservative £ savings.
 * Renders nothing until there's at least one problem, so it never nags an
 * already-tidy user.
 */
export default async function FixableProblems() {
  const { problems, totalSaving } = await getFixableProblems();

  if (problems.length === 0) {
    return (
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
            <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              No fixable problems found
            </h2>
            <p className="text-sm text-gray-500">
              We&apos;ll flag duplicate subscriptions, price rises and overspend
              here as we spot them.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">
            Your biggest fixable problems
          </h2>
          <p className="text-sm text-gray-500">
            {problems.length} thing{problems.length === 1 ? '' : 's'} worth a
            look
          </p>
        </div>
        {totalSaving > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-right">
            <FontAwesomeIcon
              icon={faSterlingSign}
              className="h-4 w-4 text-green-600"
            />
            <div>
              <p className="text-xs text-green-700">Potential savings</p>
              <p className="font-bold text-green-800">
                {formatCurrency(totalSaving)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {problems.slice(0, 5).map((problem) => {
          const config = kindConfig[problem.kind];
          return (
            <div key={problem.id} className="flex items-start gap-4 p-4">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${config.color}`}
              >
                <FontAwesomeIcon icon={config.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{problem.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityBadge[problem.severity]}`}
                  >
                    {problem.severity}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-600">{problem.detail}</p>
              </div>
              {problem.estimatedSaving > 0 && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-green-700">
                    {formatCurrency(problem.estimatedSaving)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {problem.kind === 'over_budget' ? 'this period' : 'a year'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-400">
        Estimates based on your transaction history and may not be exact. Not
        regulated financial advice.
      </p>
    </div>
  );
}
