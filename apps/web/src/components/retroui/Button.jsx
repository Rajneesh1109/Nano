import { cn } from "../../lib/utils";
import { cva } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
    "font-mono transition-all rounded-none outline-none cursor-pointer duration-200 font-medium flex items-center justify-center",
    {
        variants: {
            variant: {
                default: "shadow-retro hover:shadow-retro-hover active:translate-x-[2px] active:translate-y-[2px] bg-retro-primary text-black border-2 border-black transition hover:bg-white",
                secondary: "shadow-retro hover:shadow-retro-hover active:translate-x-[2px] active:translate-y-[2px] bg-retro-secondary text-white border-2 border-black transition hover:brightness-110",
                outline: "shadow-retro hover:shadow-retro-hover active:translate-x-[2px] active:translate-y-[2px] bg-transparent border-2 border-black transition",
                link: "bg-transparent hover:underline text-black",
                ghost: "bg-transparent hover:bg-gray-100",
            },
            size: {
                sm: "px-3 py-1 text-sm",
                md: "px-4 py-1.5 text-base",
                lg: "px-6 py-2 text-lg",
                icon: "p-2 min-w-8 h-8",
            },
        },
        defaultVariants: {
            size: "md",
            variant: "default",
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size }), className)}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button, buttonVariants };
