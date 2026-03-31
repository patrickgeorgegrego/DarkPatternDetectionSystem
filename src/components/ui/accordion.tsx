import * as React from "react"
import { cn } from "../../lib/utils"

const Accordion = ({ className, children, ...props }: any) => (
  <div className={cn("w-full space-y-2", className)} {...props}>{children}</div>
)

const AccordionItem = ({ className, children, ...props }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray.find((child: any) => child.type === AccordionTrigger);
  const content = childrenArray.find((child: any) => child.type === AccordionContent);

  return (
    <div className={cn("border-b border-slate-200", className)} {...props}>
      {trigger && React.cloneElement(trigger as React.ReactElement, { isOpen, onClick: () => setIsOpen(!isOpen) })}
      {isOpen && content}
    </div>
  )
}

const AccordionTrigger = ({ className, children, isOpen, onClick, ...props }: any) => (
  <button
    onClick={onClick}
    className={cn("flex flex-1 w-full items-center justify-between py-4 font-medium transition-all hover:underline", className)}
    {...props}
  >
    {children}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}>
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>
)

const AccordionContent = ({ className, children, ...props }: any) => (
  <div className={cn("pb-4 pt-0", className)} {...props}>{children}</div>
)

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
