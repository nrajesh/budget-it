import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateToYYYYMMDD } from "@/lib/utils";

interface BatchScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (settings: {
    frequency_value: number;
    frequency_unit: string;
    date: string;
  }) => void;
}

export function BatchScheduleDialog({
  isOpen,
  onOpenChange,
  count,
  onConfirm,
}: BatchScheduleDialogProps) {
  const [frequencyValue, setFrequencyValue] = React.useState(1);
  const [frequencyUnit, setFrequencyUnit] = React.useState("m");
  const [date, setDate] = React.useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateToYYYYMMDD(tomorrow);
  });

  const handleConfirm = () => {
    onConfirm({
      frequency_value: frequencyValue,
      frequency_unit: frequencyUnit,
      date,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule {count} Transactions</DialogTitle>
          <DialogDescription>
            These transactions will be converted into recurrent scheduled
            transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Start Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Frequency</Label>
            <div className="col-span-3 flex gap-2">
              <Input
                type="number"
                min="1"
                value={frequencyValue}
                onChange={(e) => setFrequencyValue(parseInt(e.target.value))}
                className="w-20"
              />
              <Select value={frequencyUnit} onValueChange={setFrequencyUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="d">Days</SelectItem>
                  <SelectItem value="w">Weeks</SelectItem>
                  <SelectItem value="m">Months</SelectItem>
                  <SelectItem value="y">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Schedule All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
