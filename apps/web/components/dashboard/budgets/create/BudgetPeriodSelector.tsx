'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BudgetPeriodSelectorProps {
  periodType: 'CALENDAR_MONTH' | 'PAYDAY';
  paydayDate: number;
  onPeriodTypeChange: (value: 'CALENDAR_MONTH' | 'PAYDAY') => void;
  onPaydayDateChange: (value: number) => void;
}

export default function BudgetPeriodSelector({
  periodType,
  paydayDate,
  onPeriodTypeChange,
  onPaydayDateChange,
}: BudgetPeriodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Budget Period
        </h3>
        <RadioGroup
          value={periodType}
          onValueChange={(v) =>
            onPeriodTypeChange(v as 'CALENDAR_MONTH' | 'PAYDAY')
          }
          className="space-y-3"
        >
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <RadioGroupItem
              value="CALENDAR_MONTH"
              id="calendar"
              className="mt-0.5"
            />
            <div>
              <Label
                htmlFor="calendar"
                className="font-medium text-gray-900 cursor-pointer"
              >
                Calendar Month
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                1st to last day of each month
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <RadioGroupItem value="PAYDAY" id="payday" className="mt-0.5" />
            <div className="flex-1">
              <Label
                htmlFor="payday"
                className="font-medium text-gray-900 cursor-pointer"
              >
                Payday to Payday
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Budget runs from your payday to the day before the next one
              </p>
              {periodType === 'PAYDAY' && (
                <div className="mt-3">
                  <Label
                    htmlFor="payday-date"
                    className="text-sm text-gray-600"
                  >
                    I get paid on day
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="payday-date"
                      type="number"
                      min={1}
                      max={31}
                      value={paydayDate}
                      onChange={(e) =>
                        onPaydayDateChange(Number(e.target.value))
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">of each month</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
