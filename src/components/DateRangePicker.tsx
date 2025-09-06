"use client"

import * as React from "react"
import { CalendarIcon, ChevronsLeft, ChevronsRight } from "lucide-react"
import { addYears, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn, formatDateToDDMMYYYY } from "@/lib/utils" // Import formatDateToDDMMYYYY
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  dateRange,
  onDateChange,
}: DateRangePickerProps) {
  // State to control the displayed month in the calendar
  const [month, setMonth] = React.useState<Date | undefined>(dateRange?.from || new Date());

  // Update month state when dateRange.from changes, ensuring calendar stays in sync
  React.useEffect(() => {
    if (dateRange?.from) {
      setMonth(dateRange.from);
    }
  }, [dateRange?.from]);

  const handlePreviousYear = () => {
    if (month) {
      const newMonth = addYears(month, -1);
      setMonth(newMonth);
    }
  };

  const handleNextYear = () => {
    if (month) {
      const newMonth = addYears(month, 1);
      setMonth(newMonth);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {formatDateToDDMMYYYY(dateRange.from)} -{" "} {/* Use formatDateToDDMMYYYY */}
                  {formatDateToDDMMYYYY(dateRange.to)} {/* Use formatDateToDDMMYYYY */}
                </>
              ) : (
                formatDateToDDMMYYYY(dateRange.from) // Use formatDateToDDMMYYYY
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* Custom Year Navigation */}
          <div className="flex items-center justify-between p-2 border-b">
            <Button variant="ghost" size="icon" onClick={handlePreviousYear} className="h-8 w-8">
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Previous Year</span>
            </Button>
            <span className="font-medium text-sm">
              {month ? format(month, "yyyy") : "Select Year"}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextYear} className="h-8 w-8">
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Next Year</span>
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            month={month}
            onMonthChange={setMonth}
            selected={dateRange}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}