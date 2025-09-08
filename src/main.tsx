import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { CurrencyProvider } from "./contexts/CurrencyContext.tsx";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        storageKey="portfolio-theme"
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeatureToggleProvider>
              <TooltipProvider>
                <App />
                <SpeedInsights />
              </TooltipProvider>
            </FeatureToggleProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
  
  <CurrencyProvider>
    <App />
  </CurrencyProvider>
);