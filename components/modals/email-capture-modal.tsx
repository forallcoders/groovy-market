import {
  ModalProps,
  useOnboardingMachine,
  useOnboardingModal,
} from "@/stores/onboarding"
import {
  useDynamicContext,
  useOtpVerificationRequest,
  useUserUpdateRequest,
} from "@dynamic-labs/sdk-react-core"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "../ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import OnboardingModal from "./onboarding-modal"
import { useUserContext } from "@/providers/user-provider"

const formSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required")
    .max(50, "Email is too long"),
})

const verifyFormSchema = z.object({
  verificationCode: z.string().min(1, "Verification code is required"),
})

type FormValues = z.infer<typeof formSchema>
type VerifyFormValues = z.infer<typeof verifyFormSchema>

function EmailCaptureModal({ preventClose }: ModalProps) {
  const { handleBack } = useOnboardingModal()
  const { currentState } = useOnboardingMachine()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [showVerifyForm, setShowVerifyEmailForm] = useState(false)

  return (
    <OnboardingModal
      open={currentState === "EMAIL_CAPTURE"}
      onOpenChange={() => {}}
      contentClassName="max-w-[700px] md:w-[90vw] md:!rounded-3xl p-0 max-h-full overflow-y-auto"
      previousStep={handleBack}
      preventClose={preventClose}
    >
      <div className="max-h-[80dvh] overflow-y-auto flex flex-col relative pt-10 pb-10 z-10">
        <div className="flex flex-col h-full items-center gap-[30px]">
          <Image
            src={"/icons/mail.svg"}
            alt={"Enable trading icon"}
            width={80}
            height={80}
            sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
          />
          <h2 className={"text-2xl text-center text-white font-bold"}>
            {!showVerifyForm ? "Drop your email" : "Verify your email"}
          </h2>
          {!showVerifyForm ? (
            <EmailForm
              isLoading={loading}
              setIsLoading={setLoading}
              setShowVerifyEmailForm={setShowVerifyEmailForm}
              setEmail={setEmail}
            />
          ) : (
            <VerifyEmailForm
              isLoading={loading}
              setIsLoading={setLoading}
              setShowVerifyEmailForm={setShowVerifyEmailForm}
              email={email}
            />
          )}
        </div>
      </div>
    </OnboardingModal>
  )
}

function EmailForm({
  isLoading,
  setIsLoading,
  setShowVerifyEmailForm,
  setEmail,
}: {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  setShowVerifyEmailForm: (showVerifyEmailForm: boolean) => void
  setEmail: (email: string) => void
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })
  const { user } = useDynamicContext()
  const { updateUser } = useUserUpdateRequest()
  const { send } = useOnboardingMachine()

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      const { isEmailVerificationRequired } = await updateUser({
        metadata: {
          email: values.email.trim(),
          ...user?.metadata,
        },
      })

      if (isEmailVerificationRequired) {
        setEmail(values.email.trim())
        setShowVerifyEmailForm(true)
      } else {
        send({ type: "SUBMIT_EMAIL" })
      }
    } catch (error) {
      const err = error as any
      if (err?.message?.includes("Email already exists")) {
        form.setError("email", { message: "Email already in use" })
        return
      }
      if (err?.message?.includes("Invalid email")) {
        form.setError("email", { message: "Invalid email" })
        return
      }
      if (err?.message?.includes("Email is required")) {
        form.setError("email", { message: "Email is required" })
        return
      }
      form.setError("email", { message: "Something went wrong" })
      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1 px-5 pt-1"
      >
        <div className="flex-1 min-h-0">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    {...field}
                    className="rounded-[10px] border-0 bg-[#353539] text-white text-left text-sm px-2 py-4 mx-auto placeholder:text-[#A4A4AE]"
                  />
                </FormControl>
                <FormMessage className="text-red-700 text-center mt-1" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading || !form.formState.isValid}
            className="py-5 text-sm mt-[30px] bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
          >
            Submit
          </Button>
        </div>
      </form>
    </Form>
  )
}

export function VerifyEmailForm({
  isLoading,
  setIsLoading,
  setShowVerifyEmailForm,
  email,
}: {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  setShowVerifyEmailForm: (showVerifyEmailForm: boolean) => void
  email: string | null
}) {
  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      verificationCode: "",
    },
  })
  const { setUser } = useUserContext()
  const { send } = useOnboardingMachine()

  const { verifyOtp } = useOtpVerificationRequest()

  const onSubmit = async (values: VerifyFormValues) => {
    try {
      setIsLoading(true)
      const res = await verifyOtp(values.verificationCode, "email")
      console.log({ res })
      setShowVerifyEmailForm(false)
      if (email) {
        setUser((prev) => (prev ? { ...prev, email: email } : null))
      }

      send({ type: "SUBMIT_EMAIL" })
    } catch (error) {
      console.log("Error", error)
      form.setError("verificationCode", { message: "Invalid code" })

      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-1"
      >
        <div className="flex-1 min-h-0">
          <FormField
            control={form.control}
            name="verificationCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Verification code"
                    {...field}
                    className="rounded-[10px] border-0 bg-[#353539] text-white text-left text-sm px-2 py-4 mx-auto placeholder:text-[#A4A4AE]"
                  />
                </FormControl>
                <FormMessage className="text-red-700 text-center mt-1" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading || !form.formState.isValid}
            className="py-5 text-sm mt-[30px] bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
          >
            Submit
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default EmailCaptureModal
