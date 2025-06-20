// BasicInfoSection.jsx
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { FormValues } from "./prediction-market-form";

const BasicInfoSection = ({
  formValues,
  handleInputChange,
  date,
  setDate,
  time,
  setTime,
}: {
  formValues: FormValues;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  date: Date | null;
  setDate: (date: Date | null) => void;
  time: { hour: string; minute: string };
  setTime: (time: { hour: string; minute: string }) => void;
}) => {
  return (
    <>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="marketName">Market name</Label>
          <Input
            id="marketName"
            name="marketName"
            value={formValues.marketName}
            onChange={handleInputChange}
            placeholder="Enter market name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            placeholder="Enter market description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialLiquidity">Initial Liquidity (USDC)</Label>
          <Input
            id="initialLiquidity"
            name="initialLiquidity"
            type="number"
            value={formValues.initialLiquidity}
            onChange={handleInputChange}
            className="max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Amount of USDC to use for initial market liquidity (minimum 100
            USDC)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Prediction end time</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 justify-start text-left font-normal"
                >
                  {date ? (
                    format(date, "dd/MM/yyyy")
                  ) : (
                    <span className="text-muted-foreground">dd/mm/yyyy</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date ?? undefined}
                  onSelect={(day) => setDate(day as Date | null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select
              value={time.hour}
              onValueChange={(value) => setTime({ ...time, hour: value })}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <SelectItem
                    key={hour}
                    value={hour.toString().padStart(2, "0")}
                  >
                    {hour.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={time.minute}
              onValueChange={(value) => setTime({ ...time, minute: value })}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="00" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <SelectItem
                    key={minute}
                    value={minute.toString().padStart(2, "0")}
                  >
                    {minute.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
};

export default BasicInfoSection;
