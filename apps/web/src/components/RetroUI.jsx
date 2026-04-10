import React from 'react';
import classNames from 'classnames';

export function RetroCard({ children, className }) {
    return (
        <div className={classNames("bg-white border-2 border-retro-border shadow-retro p-6", className)}>
            {children}
        </div>
    );
}

export function RetroButton({ children, onClick, className, variant = 'primary' }) {
    const bgColors = {
        primary: 'bg-retro-primary',
        secondary: 'bg-retro-secondary',
        accent: 'bg-retro-accent text-white',
        white: 'bg-white'
    };

    return (
        <button
            onClick={onClick}
            className={classNames(
                "px-6 py-2 border-2 border-retro-border shadow-retro font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-retro-hover hover:brightness-105",
                bgColors[variant],
                className
            )}
        >
            {children}
        </button>
    );
}
