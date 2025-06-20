import Image from "next/image"

interface ActionButtonProps {
  onClick: () => void
  src: string
  alt: string
  className?: string
  imageClassName?: string
}

export function ActionButton({
  onClick,
  src,
  alt,
  className = "",
  imageClassName = "",
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-2 z-20 hover:opacity-80 cursor-pointer transition-opacity outline-none ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        className={imageClassName}
        width={20}
        height={20}
        sizes="(max-width: 768px) 20px, (max-width: 1024px) 20px"
      />
    </button>
  )
}
