import { Route, Routes } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import IndexPage from "@/pages/Index";
import TransactionsPage from "@/pages/Transactions";
import AccountsPage from "@/pages/Accounts";
import CategoriesPage from "@/pages/Categories";
import PayeesPage from "@/pages/Payees";
import SettingsPage from "@/pages/Settings";
import BudgetsPage from "@/pages/Budgets";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/payees" element={<PayeesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;