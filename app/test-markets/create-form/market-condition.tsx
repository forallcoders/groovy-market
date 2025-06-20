// MarketCondition.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Trash } from "lucide-react";
import { useState } from "react";
import CryptoConditionForm from "./crypto-condition-form";
import { Condition } from "./prediction-market-form";
import SportsConditionForm, { SportsPrediction } from "./sports-condition-form";

const MarketCondition = ({
  condition,
  marketType,
  setMarketType,
  removeCondition,
  onConfirm,
}: {
  condition: Condition;
  marketType: string;
  setMarketType: (value: string) => void;
  isLast: boolean;
  removeCondition: (id: number) => void;
  onConfirm: (id: number, prediction: SportsPrediction) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const handleConfirm = (prediction: SportsPrediction) => {
    console.log({ prediction });
    onConfirm(condition.id, prediction);
    setIsOpen(false);
  };
  return (
    <Card className="mb-4 relative">
      <CardContent className="">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full cursor-pointer">
            <h4 className="font-medium mb-4">Condition {condition.id}</h4>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="icon"
            onClick={() => removeCondition(condition.id)}
            className="absolute top-4 right-4"
          >
            <Trash className="h-4 w-4" />
          </Button>
          <CollapsibleContent>
            <div className="space-y-4">
              <div className="mb-4 flex flex-col gap-2">
                <Label htmlFor={`categoryType-${condition.id}`}>
                  Market Condition Type
                </Label>
                <Select defaultValue={marketType} onValueChange={setMarketType}>
                  <SelectTrigger
                    className="w-40"
                    id={`categoryType-${condition.id}`}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {marketType === "crypto" ? (
                <CryptoConditionForm conditionId={condition.id} />
              ) : (
                <SportsConditionForm
                  conditionId={condition.id}
                  onConfirm={handleConfirm}
                  sportsCondition={condition.sportsCondition}
                />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default MarketCondition;
