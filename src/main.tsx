import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { UserProvider } from './contexts/UserContext.tsx'
import { CurrencyProvider } from './contexts/CurrencyContext.tsx'
import { TransactionsProvider } from './contexts/TransactionsContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <UserProvider>
          <CurrencyProvider>
            <TransactionsProvider>
              <App />
            </TransactionsProvider>
          </CurrencyProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)