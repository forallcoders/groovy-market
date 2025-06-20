'use client'

import { Bell, Mail } from "lucide-react";

import { Label } from "@/components/ui/Label/label";
import { Text } from "@/components/ui/Text/text";
import { Switch } from "@/components/ui/Switch/switch";
import { Checkbox } from "@/components/ui/Checkbox/checkbox";

export default function Notifications() {
  return (
    <div className="flex flex-col gap-5 max-w-[600px]">
      {/* Email Card */}
      <div className="border-1 w-full border-neutral-800 rounded-lg p-3.5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Text className="text-lg flex gap-2 items-center font-medium leading-none">
              <Mail />
              Email
            </Text>
            <div className="flex justify-between items-center">
              <Text className="text-sm font-medium leading-none">Volume traded</Text>
              <Switch />
            </div>
          </div>
        </div>
      </div>
      {/* In-app Card */}
      <div className="border-1 w-full border-neutral-800 rounded-lg p-3.5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Text className="text-lg flex gap-2 items-center font-medium leading-none">
              <Bell />
              In-app
            </Text>
            <div className="flex justify-between items-center">
              <Text className="text-sm font-medium leading-none">Orders fills</Text>
              <Switch />
            </div>
            <div className="flex gap-2 items-center">
              <Checkbox id="hide-small" className="text-sm leading-none" />
              <Label className="mb-0 text-xs font-light">Hide small fills (&lt;1 share)</Label>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-sm font-medium leading-none">Resolutions</Text>
              <Switch checked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}