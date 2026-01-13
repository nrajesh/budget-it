import React, { createContext, useContext, useState, useEffect } from 'react';

type DashboardStyle = 'standard' | 'financial-pulse';

interface ThemeContextType {
    dashboardStyle: DashboardStyle;
    setDashboardStyle: (style: DashboardStyle) => void;
    isFinancialPulse: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dashboardStyle, setDashboardStyleState] = useState<DashboardStyle>('standard');

    useEffect(() => {
        const savedStyle = localStorage.getItem('dashboardStyle') as DashboardStyle;
        if (savedStyle) {
            setDashboardStyleState(savedStyle);
        }
    }, []);

    const setDashboardStyle = (style: DashboardStyle) => {
        setDashboardStyleState(style);
        localStorage.setItem('dashboardStyle', style);
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-dashboard-style', dashboardStyle);
    }, [dashboardStyle]);

    const isFinancialPulse = dashboardStyle === 'financial-pulse';

    return (
        <ThemeContext.Provider value={{ dashboardStyle, setDashboardStyle, isFinancialPulse }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
