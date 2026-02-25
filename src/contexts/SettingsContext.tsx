import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    currency: string;
    setCurrency: (currency: string) => void;
    formatCurrency: (amount: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState(() => localStorage.getItem('app_currency') || 'USD');

    useEffect(() => {
        localStorage.setItem('app_currency', currency);
    }, [currency]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}