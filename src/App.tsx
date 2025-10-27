import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import About from "./pages/About";
import Budgets from "./pages/Budgets";
import Transactions from "./pages/Transactions";
import ScheduledTransactions from "./pages/ScheduledTransactions";
import Accounts from "./pages/Accounts";
import Vendors from "./pages/Vendors";
import Categories from "./pages/Categories";
import Reports from "./pages/reports/Reports";
import EssentialReports from "./pages/reports/EssentialReports";
import AdvancedReports from "./pages/reports/AdvancedReports";
import SettingsPage from "./pages/SettingsPage";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Index />} />
        <Route path="about" element={<About />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="scheduled" element={<ScheduledTransactions />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="categories" element={<Categories />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/essential" element={<EssentialReports />} />
        <Route path="reports/advanced" element={<AdvancedReports />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;