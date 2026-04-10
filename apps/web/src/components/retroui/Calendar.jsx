"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "../../lib/utils"
import { Button, buttonVariants } from "./Button"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    formatters,
    components,
    ...props
}) {
    const defaultClassNames = getDefaultClassNames()

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(
                "bg-white border-2 border-black shadow-retro p-3",
                className
            )}
            captionLayout={captionLayout}
            formatters={{
                formatMonthDropdown: (date) =>
                    date.toLocaleString("default", { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
                month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
                nav: cn("flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between", defaultClassNames.nav),
                button_previous: cn(buttonVariants({ variant: 'outline', size: 'icon' }), "size-8 select-none z-10", defaultClassNames.button_previous),
                button_next: cn(buttonVariants({ variant: 'outline', size: 'icon' }), "size-8 select-none z-10", defaultClassNames.button_next),
                month_caption: cn("flex items-center justify-center font-black uppercase text-sm", defaultClassNames.month_caption),
                day: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-retro-bg",
                    defaultClassNames.day
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-retro-primary hover:text-black transition-all"
                ),
                selected: "bg-retro-secondary text-white hover:bg-retro-secondary hover:text-white focus:bg-retro-secondary focus:text-white",
                today: "border-2 border-retro-primary text-retro-text",
                outside: "text-gray-300 opacity-50",
                disabled: "text-gray-300 opacity-50",
                range_middle: "aria-selected:bg-retro-bg aria-selected:text-retro-text",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className={cn("size-4", className)} {...props} />
                    }
                    if (orientation === "right") {
                        return <ChevronRight className={cn("size-4", className)} {...props} />
                    }
                    return <ChevronDown className={cn("size-4", className)} {...props} />
                },
                ...components,
            }}
            {...props}
        />
    )
}

export { Calendar }
