/* eslint-disable @next/next/no-img-element */
"use client"

import { useComments } from "@/hooks/use-comments"
import { useState } from "react"
import { Avatar, AvatarFallback } from "../../../../components/ui/Avatar/avatar"

type CommentsSectionProps = {
  marketId: string
}

const CommentInput: React.FC<{ marketId: string }> = ({ marketId }) => {
  const [comment, setComment] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refetch } = useComments(marketId)
  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Comment cannot be empty")
      return
    }

    setIsPosting(true)

    try {
      const response = await fetch("/api/markets/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment,
          marketId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      setComment("")
      setError(null)
      setIsPosting(false)
      // sleep for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000))
      refetch()
    } catch (error) {
      console.error("Error posting comment:", error)
      setError("Failed to post comment")
      setIsPosting(false)
    }
  }
  return (
    <>
      {/* Mobile View */}
      <div className="flex gap-2 items-center sm:hidden">
        <input
          type="text"
          placeholder="Add a comment"
          className=" flex-1 py-2 px-2 text-sm border-2 border-[#353739] rounded-[5px] placeholder:text-white/60 placeholder:text-xs focus-visible:outline-none"
          onChange={(e) => setComment(e.target.value)}
          value={comment}
        />
        <button
          className="h-[30px] w-24 py-1.5 bg-[#415058] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px] disabled:bg-[#415058]/50 disabled:text-[#141414]"
          onClick={handleSubmit}
          disabled={isPosting || !comment.trim()}
        >
          Post
        </button>
      </div>
      {/* Desktop View */}
      <div className="hidden sm:flex border-1 mt-4 rounded-[10px] border-[#353739] p-2 pl-4 gap-2">
        <input
          type="text"
          placeholder="Add a comment"
          className="flex-1 text-sm bg-transparent rounded-[5px] border-0 placeholder:text-white/60 focus-visible:outline-none"
          onChange={(e) => setComment(e.target.value)}
          value={comment}
        />
        <button
          className="w-[26vw] max-w-26 py-1.5 bg-[#415058] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px] disabled:bg-[#415058]/50 disabled:text-[#141414]"
          onClick={handleSubmit}
          disabled={isPosting || !comment.trim()}
        >
          Post
        </button>
      </div>
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </>
  )
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ marketId }) => {
  const { comments, isLoading, error } = useComments(marketId)
  if (isLoading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="lg:mb-5">
      <h3 className="pb-2 inline-block text-lg font-medium border-b-2 border-white">
        Comments ({comments?.length})
      </h3>
      <hr className="mb-4 -mt-[2px] border-[#353739] border-b-2" />
      <CommentInput marketId={marketId} />
      <div className="mt-8">
        {comments?.map((comment) => (
          <CommentItem key={comment.id} comment={comment as any} />
        ))}
      </div>
    </div>
  )
}

const CommentItem: React.FC<{ comment: any }> = ({ comment }) => {
  // const [showReplies, setShowReplies] = useState(false);
  // const hasReplies = Boolean(comment.replies && comment.replies.length > 0);
  return (
    <div className="mt-4">
      <div className="flex gap-2 items-start">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.username}
            className="w-12 h-12 rounded-full border"
          />
        ) : (
          <Avatar className="size-12">
            <AvatarFallback />
          </Avatar>
        )}
        <div className="flex-1 text-[13px]">
          <div className="flex flex-wrap items-center gap-x-1.5">
            <span>{comment.username}</span>
            {/* {comment.vote && (
              <span
                className={cn(
                  "px-[0.3rem] py-[0.2rem] leading-normal text-white text-xs rounded-[2px]",
                  {
                    "bg-[#CC0066]/25 text-[#FFA9D4] font-light":
                      comment.voteOutcome,
                    "bg-[#9900CC]/25 text-[#EFBDFF] font-light":
                      !comment.voteOutcome,
                  }
                )}
              >
                {comment.vote}
              </span>
            )} */}
            <span className="text-xs text-[#81898E]">{comment.timeAgo}</span>
          </div>
          <p className="mt-1 font-light">{comment.comment}</p>
          {/* <div className="flex items-center gap-3 mt-2 text-xs text-[#81898E]">
            {comment.likes ? (
              <span>❤️ {comment.likes}</span>
            ) : (
              <Heart className="h-3.5 w-3.5" />
            )}
            <button>Reply</button>
          </div> */}
          {/* {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm mt-2"
            >
              {showReplies
                ? `Hide ${comment.replies?.length} replies`
                : `Show ${comment.replies?.length} replies`}
              {showReplies ? (
                <ChevronUp className="w-4 h-4 inline" />
              ) : (
                <ChevronDown className="w-4 h-4 inline" />
              )}
            </button>
          )}
          {showReplies && comment.replies && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} />
              ))}
            </div>
          )} */}
        </div>
      </div>
    </div>
  )
}

export default CommentsSection
