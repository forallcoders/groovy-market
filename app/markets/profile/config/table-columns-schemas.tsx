import { Button } from "@/components/ui/Button/Button";
import { Text } from "@/components/ui/Text/text";
import { cn } from "@/lib/utils";
import { differenceInHours } from "date-fns";
import { Check, Ellipsis, ExternalLink, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const getHistoryTypeStyles = (type: string): string => {
  const historyTypeStyles = {
    deposit: "text-berry-500",
    withdraw: "text-orchid-200",
  };
  return (historyTypeStyles as any)[type] ?? "";
};

const statusIcons = {
  completed: <Check className="size-4" />,
  pending: <Ellipsis className="size-4" />,
  error: <X className="size-4" />,
};

/*
 If we only access to the cell data to format it, 
 we can use (data), and then access to values with data.getValue()

 cell: (data) => {
      const { description, image } = data.getValue();
      ...

 But, if we use accessorFn, to determine the value will be used to sort
 the column, in the cell we must to use ({ row }) and then access to values
 with row.original.[accessorKey]

accessorKey: "positionDetails",
accessorFn: (row) => row.positionDetails.value,
cell: ({ row }) => {
      const { value, price, shares } = row.original.positionDetails;
      ...
*/

export const positionsTableColumnSchema = [
  {
    accessorKey: "market",
    header: "Market",
    cell: (data: any) => {
      const d = data.getValue();
      const description = d?.description;
      const image = d?.image;
      const url = d?.url;
      if (!image) return null;
      return (
        <Link href={url} className="flex gap-2 items-center">
          <img
            src={image}
            alt={description}
            width={65}
            height={65}
            className="w-[35px] h-[35px]"
          />
          <Text className="text-neutral-400 font-medium">{description}</Text>
        </Link>
      );
    },
  },
  {
    accessorKey: "positionDetails",
    header: "Position",
    accessorFn: (row: { positionDetails: { value: number } }) =>
      row.positionDetails.value,
    cell: ({
      row,
    }: {
      row: {
        original: {
          positionDetails: { value: boolean; price: string; shares: number };
        };
      };
    }) => {
      const { value, price, shares } = row.original.positionDetails || {};
      return (
        <div className="flex flex-col">
          <Text
            className={`text-xs ${
              value ? "text-mint-500" : "text-destructive"
            }`}
          >
            {value ? "Yes" : "No"}
          </Text>
          <Text className="text-xs leading-none text-white">
            {" "}
            {(parseFloat(price) * 100).toFixed(0)} ¢
          </Text>
          <Text className="text-xs text-neutral-500">{shares} shares</Text>
        </div>
      );
    },
  },
  {
    accessorKey: "latest",
    header: "Latest",
    cell: (value: any) => (value.getValue() * 100).toFixed(0) + "¢",
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: (value: any) =>
    {
      if (!value) return null;
      return "$" + value.getValue()?.toFixed(2);
    }
  },
  {
    accessorKey: "current",
    header: "Current",
    cell: (info: { getValue: () => { value: number; percentage: number } }) => {
      const { value, percentage } = info.getValue() || {};
      return (
        <div className="flex flex-col">
          <Text className="text-xs leading-none text-white">
            $ {value?.toFixed(2)}
          </Text>
          <Text
            className={`text-xs ${
              percentage > 0 ? "text-mint-500" : "text-destructive"
            }`}
          >
            ({percentage}%)
          </Text>
        </div>
      );
    },
  },
  {
    accessorKey: "toGet",
    header: "To get",
    cell: (value: any) =>
    {
      if (!value) return null;
      return "$" + value.getValue()?.toFixed(2);
    }
  },
];

export const openOrdersTableColumnSchema = [
  {
    accessorKey: "market",
    header: "Market",
    cell: (data: {
      getValue: () => { description: string; image: string };
    }) => {
      const { description, image } = data.getValue() || {};
      if (!image) return null;
      return (
        <div className="flex gap-2 items-center">
          <img
            src={image}
            alt=""
            width={65}
            height={65}
            className="w-[35px] h-[35px]"
          />
          <Text className="text-neutral-400 font-medium">{description}</Text>
        </div>
      );
    },
  },
  {
    accessorKey: "positionDetails",
    header: "Position",
    accessorFn: (row: { positionDetails: { value: number } }) =>
      row.positionDetails.value,
    cell: ({
      row,
    }: {
      row: {
        original: {
          positionDetails: { value: boolean; price: string; shares: number };
        };
      };
    }) => {
      const { value, price, shares } = row.original.positionDetails || {};
      return (
        <div className="flex flex-col">
          <Text
            className={`text-xs ${
              value ? "text-mint-500" : "text-destructive"
            }`}
          >
            {value ? "Yes" : "No"}
          </Text>
          <Text className="text-xs leading-none text-white">$ {price}</Text>
          <Text className="text-xs text-neutral-500">{shares} shares</Text>
        </div>
      );
    },
  },
  {
    accessorKey: "filled",
    header: "Filled",
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: (value: any) =>
    {
      if (!value) return null;
      return "$" + Number(value.getValue())?.toFixed(2);
    }
  },
];

export const activityTableColumnSchema = [
  {
    accessorKey: "type",
    header: "Type",
  },

  {
    accessorKey: "market",
    header: "Market",
    cell: (data: any) => {
      const {
        description,
        image,
        outcome,
        yesLabel,
        noLabel,
        pricePerShare,
        shares,
      } = data.getValue() || {};
      return (
        <div className="flex gap-2 items-center">
          <img src={image} alt={description} width={35} height={35} />
          <div className="flex flex-col gap-1">
            <Text className="text-xs leading-none text-white">
              {description}
            </Text>
            <div className="flex gap-1">
              {outcome !== null && (
                <span
                  className={cn("text-xs leading-none w-max", {
                    "text-mint-500 bg-mint-500/20 px-1 py-0.5":
                      outcome === yesLabel,
                    "text-destructive bg-destructive/20 px-1 py-0.5":
                      outcome === noLabel,
                  })}
                >
                  {outcome} {Number(pricePerShare * 100).toFixed(0)}¢
                </span>
              )}
              <span className="text-muted-foreground">
                {shares.toFixed(0)} shares
              </span>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "details",
    header: "Amount",
    cell: (data: any) => {
      const { amount, date, transactionHash } = data.getValue() || {};
      const formattedDate = differenceInHours(new Date(), new Date(date));
      return (
        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <Text className="text-xs leading-none text-white">
              $ {amount.toFixed(2)}
            </Text>
            <div className="flex gap-1">
              <span className="text-muted-foreground">
                {formattedDate} hours ago
              </span>
            </div>
          </div>
          <Button variant="gray" size="icon" className="px-2 text-xs" asChild>
            <a href={`https://seitrace.com/tx/${transactionHash}?chain=atlantic-2`} target="_blank">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      );
    },
  },
];

export const historyTableColumnSchema = [
  {
    accessorKey: "type",
    header: "Type",
    cell: (data: { getValue: () => string }) => {
      const type = data.getValue() || "";
      return (
        <Text
          className={cn(
            "flex w-fit font-semibold capitalize text-xs",
            getHistoryTypeStyles(type)
          )}
        >
          {type}
        </Text>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    accessorFn: (row: { amount: { value: number } }) => row.amount.value,
    cell: ({
      row,
    }: {
      row: {
        original: {
          amount: { logo: string; value: string; type: string; hash: string };
        };
      };
    }) => {
      const { logo, value, type, hash } = row.original.amount || {};
      if (!logo) return null;
      return (
        <div className="flex gap-2 w-full">
          {logo && <Image src={logo} alt="logo" width={35} height={35} />}
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <div className="flex gap-1">
              <Text className="text-xs text-white font-semibold">{value}</Text>
              <Text className="text-xs text-neutral-400">{type}</Text>
            </div>
            <Text className="text-xs text-neutral-400 truncate">{hash}</Text>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: (date: { getValue: () => Date }) =>
      date
        .getValue()
        ?.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        ?.replace(/ /g, " "),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (value: { getValue: () => string }) => {
      const status = value.getValue() || "";
      return (
        <Text
          className={cn(
            "text-xs font-medium flex capitalize",
            status === "error" && "text-[#FF483E]"
          )}
        >
          <span className="mr-1">{(statusIcons as any)[status]}</span>
          {status}
        </Text>
      );
    },
  },
];
