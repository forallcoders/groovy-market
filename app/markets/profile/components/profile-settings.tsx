"use client"

import { Camera } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/input"
import { Label } from "@/components/ui/Label/label"
import { Textarea } from "@/components/ui/Textarea/textarea"
import { toast } from "@/hooks/use-toast"
import { useUserUpdateRequest } from "@dynamic-labs/sdk-react-core"
import axios from "axios"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

interface ProfileSettingsProps {
  email: string
  username: string
  bio: string
  avatar: string
}

type FormValues = {
  email: string
  username: string
  bio: string
}

export default function ProfileSettings({
  email,
  username,
  bio,
  avatar,
}: ProfileSettingsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [defaultValues, setDefaultValues] = useState<FormValues>({
    email: email ?? "",
    username: username ?? "",
    bio: bio ?? "",
  })

  const { updateUser } = useUserUpdateRequest()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setError,
  } = useForm<FormValues>({
    defaultValues,
    mode: "onChange",
  })

  useEffect(() => {
    setDefaultValues({
      email: email ?? "",
      username: username ?? "",
      bio: bio ?? "",
    })
    reset({
      email: email ?? "",
      username: username ?? "",
      bio: bio ?? "",
    })
  }, [email, username, bio, reset])

  const hasRequiredFields = () => {
    return !defaultValues.username || watch("username")?.trim()
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const validData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
          const trimmedValue = typeof value === "string" ? value.trim() : value
          return (
            trimmedValue !== "" &&
            trimmedValue !== (defaultValues as any)[key]?.trim()
          )
        })
      )

      if (Object.keys(validData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to your profile",
        })
        setIsSubmitting(false)
        return
      }

      const { isEmailVerificationRequired } = await updateUser({
        username: validData.username,
        email: validData.email,
        metadata: {
          bio: validData.bio,
          avatar,
        },
      })
      console.log({ isEmailVerificationRequired })

      // Reset form with new values
      reset({ ...defaultValues, ...validData })
    } catch (err: any) {
      if (err?.message?.includes("Username already exists")) {
        setError("username", {
          message: "Username already exists",
        })
        toast({
          title: "Update failed",
          description: "Username already exists",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG or PNG image",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const { data } = await axios.post("/api/user/avatar", formData)

      await updateUser({
        metadata: {
          avatar: data.url,
          bio: defaultValues.bio,
        },
      })

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 max-w-[600px]"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} />
            <AvatarFallback />
          </Avatar>
          <Button
            size="sm"
            className="flex !px-5 gap-2 bg-[#4E5458] hover:bg-[#4E5458]/80 justify-around text-white font-semibold"
            onClick={() => document.getElementById("fileInput")?.click()}
            type="button"
          >
            <Camera />
            Upload
            <Input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          className="font-medium"
          {...register("username", {
            required: defaultValues.username ? "Username is required" : false,
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message:
                "Username can only contain letters, numbers, underscores and hyphens",
            },
          })}
        />
      </div>
      <div>
        <Label>Bio (0/180)</Label>
        <Textarea className="min-h-28" {...register("bio")} id="bio" />
      </div>
      <Button
        disabled={
          !isDirty ||
          !hasRequiredFields() ||
          Object.keys(errors).length > 0 ||
          isSubmitting
        }
        type="submit"
        className="w-36 text-[13px]"
        size="sm"
        variant="berry"
      >
        Save Changes
      </Button>
    </form>
  )
}
