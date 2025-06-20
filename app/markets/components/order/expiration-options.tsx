import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

interface ExpirationOptionsProps {
  useExpiration: boolean
  setUseExpiration: (value: boolean) => void
  expiration: number
  setExpiration: (value: number) => void
  customExpiration: string
  setCustomExpiration: (value: string) => void
}

export function ExpirationOptions({
  useExpiration,
  setUseExpiration,
  expiration,
  setExpiration,
  customExpiration,
  setCustomExpiration,
}: ExpirationOptionsProps) {
  return (
    <div className="px-4 mt-1 mb-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-[#81898E]">
          Set Expiration
        </Label>
        <Switch
          checked={useExpiration}
          onCheckedChange={setUseExpiration}
          className="text-[#81898E] data-[state=unchecked]:bg-[#81898E] data-[state=checked]:bg-[#00CC66]"
        />
      </div>

      {useExpiration && (
        <div className="mt-2">
          <select
            value={expiration.toString()}
            onChange={(e) => setExpiration(parseInt(e.target.value))}
            className="w-full bg-[#81898E] border-2 border-foreground rounded-[5px] p-2 text-sm outline-none text-white font-medium"
          >
            <option value={(24 * 60 * 60).toString()}>1 Day</option>
            <option value={(7 * 24 * 60 * 60).toString()}>7 Days</option>
            <option value={(30 * 24 * 60 * 60).toString()}>30 Days</option>
            <option value="0">Custom Date</option>
          </select>

          {expiration === 0 && (
            <div className="mt-2">
              <Input
                type="date"
                value={customExpiration}
                onChange={(e) => setCustomExpiration(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="h-8 text-xs border-2 border-foreground rounded-[5px] outline-none text-[#81898E]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
