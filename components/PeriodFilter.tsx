"use client"

import { ChevronDown } from "lucide-react"

type Period = 'this-week' | 'last-week' | '2-weeks' | '1-month'

interface PeriodFilterProps {
  onPeriodChange: (period: Period) => void
  currentPeriod: Period
}

export default function PeriodFilter({ onPeriodChange, currentPeriod }: PeriodFilterProps) {
  const periods = [
    { value: 'this-week' as Period, label: 'Cette semaine' },
    { value: 'last-week' as Period, label: 'Semaine dernière' },
    { value: '2-weeks' as Period, label: '2 semaines' },
    { value: '1-month' as Period, label: '1 mois' }
  ]

  const currentLabel = periods.find(p => p.value === currentPeriod)?.label || 'Cette semaine'

  return (
    <div className="relative inline-block">
      <select 
        value={currentPeriod}
        onChange={(e) => onPeriodChange(e.target.value as Period)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#29C2E2] focus:border-transparent cursor-pointer shadow-sm"
      >
        {periods.map(period => (
          <option key={period.value} value={period.value}>
            {period.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  )
}