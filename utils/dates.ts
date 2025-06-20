import { format, parseISO } from "date-fns"

export const formatDate = ({
  dateString,
  dateFormat = "MMMM d, h:mm a",
}: {
  dateString: string
  dateFormat?: string
}) => {
  if (!dateString) return null
  const parsedDate = parseISO(new Date(dateString).toISOString())
  const formattedDate = format(parsedDate, dateFormat)
  return formattedDate
}
