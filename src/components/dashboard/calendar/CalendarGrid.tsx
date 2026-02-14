import React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  dayData: Record<
    string,
    { count: number; netAmount: number; hasScheduled: boolean }
  >;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  onDateChange,
  selectedDate,
  onSelectDate,
  dayData,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Select
            value={currentDate.getMonth().toString()}
            onValueChange={(value) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(value));
              onDateChange(newDate);
            }}
          >
            <SelectTrigger className="w-[120px] font-bold text-lg border-none shadow-none focus:ring-0 px-0 h-auto gap-2">
              <SelectValue>{format(currentDate, "MMMM")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {format(new Date(2024, i, 1), "MMMM")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDate.getFullYear().toString()}
            onValueChange={(value) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(parseInt(value));
              onDateChange(newDate);
            }}
          >
            <SelectTrigger className="w-[80px] font-bold text-lg border-none shadow-none focus:ring-0 px-0 h-auto gap-2">
              <SelectValue>{format(currentDate, "yyyy")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 21 }).map((_, i) => {
                const year = new Date().getFullYear() - 10 + i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground mb-2 shrink-0">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 flex-1 min-h-0 grid-rows-6">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const data = dayData[dateKey] || {
              count: 0,
              netAmount: 0,
              hasScheduled: false,
            };
            const count = data.count;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);

            // Determine background color
            let bgClass = "bg-card";
            if (data.netAmount !== 0) {
              if (data.netAmount > 0)
                bgClass = "bg-green-50 dark:bg-green-900/30";
              else if (data.netAmount < 0)
                bgClass = "bg-red-50 dark:bg-red-900/30";
            }

            if (isSelected) {
              bgClass = "bg-primary/20 border-primary";
            } else if (!isCurrentMonth) {
              bgClass = "bg-muted/10";
            }

            // Scheduled indicator style
            // "different weight of shading for future dates" - or just a visual cue.
            // Let's use a subtle pattern or border for scheduled if in future.
            const hasScheduled = data.hasScheduled;

            return (
              <div
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative flex flex-col items-start justify-start p-1 md:p-2 rounded-md cursor-pointer border transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "text-muted-foreground/50",
                  !isSelected && "border-transparent",
                  bgClass,
                  // isSelected handled in bgClass logic above partly, but border needs to stick
                  // actually let's refine:
                )}
              >
                <div className="flex justify-between w-full">
                  <div
                    className={cn(
                      "text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                      isSameDay(day, new Date()) &&
                      "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {hasScheduled && (
                    <div
                      className="w-2 h-2 rounded-full bg-blue-400"
                      title="Scheduled Transaction"
                    />
                  )}
                </div>

                {count > 0 && (
                  <div className="mt-auto w-full">
                    <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full w-fit">
                      {count} txns
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
