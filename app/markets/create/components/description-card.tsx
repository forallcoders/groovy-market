import { useState, useRef } from "react"
import Image from "next/image"

import { Text } from "@/components/ui/Text/text"
import { Label } from "@/components/ui/Label/label"
import { Input } from "@/components/ui/Input/input"
import { Textarea } from "@/components/ui/Textarea/textarea"

interface DescriptionCardProps {
  marketName: string
  description: string
  onMarketNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onImageChange: (file: File) => void
  previewUrl: string | null
}

export default function DescriptionCard({
  marketName,
  description,
  onMarketNameChange,
  onDescriptionChange,
  onImageChange,
  previewUrl,
}: DescriptionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Call the parent's onImageChange
    onImageChange(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col sm:flex-row w-full bg-neutral-750 rounded-lg p-3.5 gap-4">
      <div className="md:w-32 self-center sm:self-auto">
        <div
          className="flex flex-col items-center justify-between md:h-32 border-2 p-4 text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer hover:bg-neutral-700/20 transition-colors"
          onClick={handleClick}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Market image"
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Image
                src="/icons/image.svg"
                alt="icon"
                width={37}
                height={37}
                className="w-9 h-9"
              />
              <Text className="md:mt-0 mt-4" variant="small">Click to upload max 5mb</Text>
            </>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <div className="flex flex-col grow gap-4">
        <div className="flex flex-col grow">
          <Label htmlFor="name">Market name</Label>
          <Input
            id="name"
            placeholder="Enter name"
            value={marketName}
            onChange={(e) => onMarketNameChange(e.target.value)}
          />
        </div>
        <div className="flex flex-col grow">
          <Label htmlFor="description">
            Market description ({description.length}/180)
          </Label>
          <Textarea
            className="h-28"
            id="description"
            placeholder="Enter description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            maxLength={180}
          />
        </div>
      </div>
    </div>
  )
}
