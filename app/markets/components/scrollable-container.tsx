interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableContainer = ({
  children,
  className = ""
}: ScrollableContainerProps) => {
  return (
    <div className={`overflow-y-auto scrollbar-invisible ${className}`}>
      {children}
    </div>
  );
};