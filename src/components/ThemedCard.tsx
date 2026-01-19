import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';


// Define the standard glassmorphism styles
// Light: Clean white/glass, Dark: Subtle dark glass
const GLASS_CARD_CLASS = "relative overflow-hidden rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-300 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100";
const GLASS_HEADER_CLASS = "border-b border-slate-200/50 dark:border-slate-800/50";
const GLASS_TITLE_CLASS = "text-slate-900 dark:text-slate-100";
const GLASS_DESCRIPTION_CLASS = "text-slate-500 dark:text-slate-400";

// --- Themed Wrapper Components ---

const ThemedCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    return (
        <Card
            ref={ref}
            className={cn(
                GLASS_CARD_CLASS,
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
});
ThemedCard.displayName = "ThemedCard";

const ThemedCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    return (
        <CardHeader
            ref={ref}
            className={cn(
                GLASS_HEADER_CLASS,
                className
            )}
            {...props}
        />
    );
});
ThemedCardHeader.displayName = "ThemedCardHeader";

const ThemedCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => {
    return (
        <CardTitle
            ref={ref}
            className={cn(
                GLASS_TITLE_CLASS,
                className
            )}
            {...props}
        />
    );
});
ThemedCardTitle.displayName = "ThemedCardTitle";

const ThemedCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
    return (
        <CardDescription
            ref={ref}
            className={cn(
                GLASS_DESCRIPTION_CLASS,
                className
            )}
            {...props}
        />
    );
});
ThemedCardDescription.displayName = "ThemedCardDescription";

const ThemedCardContent = CardContent;
const ThemedCardFooter = CardFooter;

export {
    ThemedCard,
    ThemedCardHeader,
    ThemedCardTitle,
    ThemedCardDescription,
    ThemedCardContent,
    ThemedCardFooter
};
