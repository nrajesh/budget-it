import { CurrencyManagement } from "@/components/management/CurrencyManagement";

const CurrenciesPage = () => {
  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            Currencies
          </h1>
          <p className="app-page-subtitle">
            Manage your active currencies and exchange rates.
          </p>
        </div>
      </div>
      <div className="tour-currencies-mgmt">
        <CurrencyManagement />
      </div>
    </div>
  );
};

export default CurrenciesPage;
