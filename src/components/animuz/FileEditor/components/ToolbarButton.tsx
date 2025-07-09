import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CircleAlert, LoaderCircle } from "lucide-react";

const ToolbarButton = ({
  onClick,
  isLoading = false,
  isError = false,
  isActive = false,
  disabled = false,
  Icon,
  label,
}: {
  onClick?: () => void;
  isActive?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  Icon: React.ElementType;
  label: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "relative flex items-center cursor-pointer p-2 bg-none rounded-md disabled:cursor-not-allowed group/button hover:bg-neutral-100 transition-all duration-150 active:scale-90"
          )}
          aria-label={label}
        >
          <Icon
            className={cn(
              "size-4 group-disabled/button:opacity-20",
              isActive && "text-blue-500",
              isError && "text-red-500"
            )}
          />
          {isError && (
            <CircleAlert className="absolute size-2.5 right-0 top-0 text-red-500" />
          )}
          {isLoading && (
            <LoaderCircle className="absolute size-2.5 right-0 top-0 opacity-20 animate-spin" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={-2}
        className="rounded-md px-2 py-1 text-xs shadow-lg  text-white"
      >
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolbarButton;
