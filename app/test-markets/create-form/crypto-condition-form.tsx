// CryptoConditionForm.jsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CryptoConditionForm = ({ conditionId }: { conditionId: number }) => {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor={`token-${conditionId}`}>Token</Label>
        <Select>
          <SelectTrigger className="w-40" id={`token-${conditionId}`}>
            <SelectValue placeholder="Select a token" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bitcoin">Bitcoin</SelectItem>
            <SelectItem value="ethereum">Ethereum</SelectItem>
            <SelectItem value="solana">Solana</SelectItem>
            <SelectItem value="others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor={`metric-${conditionId}`}>Metric</Label>
        <Select>
          <SelectTrigger className="w-40" id={`metric-${conditionId}`}>
            <SelectValue placeholder="Select a metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="marketcap">Market Cap</SelectItem>
            <SelectItem value="supply">Supply</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor={`condition-${conditionId}`}>Condition</Label>
        <Select>
          <SelectTrigger className="w-40" id={`condition-${conditionId}`}>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="greater">Greater than</SelectItem>
            <SelectItem value="less">Less than</SelectItem>
            <SelectItem value="equal">Equal to</SelectItem>
            <SelectItem value="between">Between</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`value-${conditionId}`}>Value</Label>
          <Input id={`value-${conditionId}`} placeholder="Enter value in USD" />
        </div>
      </div>
    </>
  );
};

export default CryptoConditionForm;
