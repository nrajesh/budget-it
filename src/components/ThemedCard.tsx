import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

// Define the "Financial Pulse" glassmorphism styles
// Define the "Financial Pulse" glassmorphism styles
const GLASS_CARD_CLASS = "relative overflow-hidden rounded-2xl border border-indigo-500/20 !bg-transparent bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md shadow-xl text-white";
const GLASS_HEADER_CLASS = "border-b border-white/10";
const GLASS_TITLE_CLASS = "text-white";
const GLASS_DESCRIPTION_CLASS = "text-slate-300";

// --- Themed Wrapper Components ---

const ThemedCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    const { isFinancialPulse } = useTheme();
    return (
        <Card
            ref={ref}
            className={cn(
                isFinancialPulse ? GLASS_CARD_CLASS : "",
                isFinancialPulse ? "shadow-indigo-500/10" : "", // Add colored shadow
                className
            )}
            {...props}
        >
            {isFinancialPulse && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
            )}
            {children}
        </Card>
    );
});
ThemedCard.displayName = "ThemedCard";

const ThemedCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const { isFinancialPulse } = useTheme();
    return (
        <CardHeader
            ref={ref}
            className={cn(
                isFinancialPulse ? GLASS_HEADER_CLASS : "",
                className
            )}
            {...props}
        />
    );
});
ThemedCardHeader.displayName = "ThemedCardHeader";

const ThemedCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => {
    const { isFinancialPulse } = useTheme();
    return (
        <CardTitle
            ref={ref}
            className={cn(
                isFinancialPulse ? GLASS_TITLE_CLASS : "",
                className
            )}
            {...props}
        />
    );
});
ThemedCardTitle.displayName = "ThemedCardTitle";

const ThemedCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => {
    const { isFinancialPulse } = useTheme();
    return (
        <CardDescription
            ref={ref}
            className={cn(
                isFinancialPulse ? GLASS_DESCRIPTION_CLASS : "",
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
