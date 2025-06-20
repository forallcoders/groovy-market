"use client"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type RulesProps = {
  text: string[]
}

const Rules: React.FC<RulesProps> = ({ text }) => {
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const CONTENT_PREVIEW_LINES = 3
  const MAX_HEIGHT = 20 * CONTENT_PREVIEW_LINES

  useEffect(() => {
    if (contentRef.current) {
      setIsOverflowing(contentRef.current.scrollHeight > MAX_HEIGHT)
    }
  }, [text])

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  return (
    <div className="rounded-lg my-8">
      <h3 className="text-2xl">Rules</h3>
      <div
        ref={contentRef}
        className="mt-2  overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: expanded
            ? `${contentRef.current?.scrollHeight}px`
            : `${MAX_HEIGHT}px`,
        }}
      >
        {text.map((t, i) => (
          <p
            key={i}
            className="text-[13px]"
            dangerouslySetInnerHTML={{ __html: t }}
          />
        ))}
      </div>
      {isOverflowing && (
        <Button
          onClick={toggleExpand}
          variant={"ghost"}
          className="h-[20px] mt-2 p-0 flex items-center text-[13px] ring-offset-transparent"
        >
          {expanded ? "Show less" : "Show more"}{" "}
          {expanded ? (
            <ChevronUp className="!w-6 !h-6" />
          ) : (
            <ChevronDown className="!w-6 !h-6" />
          )}
        </Button>
      )}
    </div>
  )
}
export default Rules
