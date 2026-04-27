import ScheduledBackups from "@/components/backup/ScheduledBackups";

const BackupPage = () => {
  return (
    <div className="page-container">
      <div className="app-page-header flex flex-col items-start justify-between md:flex-row md:items-center">
        <div>
          <h1 className="app-gradient-title app-page-title">
            Backup
          </h1>
          <p className="app-page-subtitle">
            Configure automated backups for your peace of mind.
          </p>
        </div>
      </div>
      <div className="tour-backup-settings">
        <ScheduledBackups />
      </div>
    </div>
  );
};

export default BackupPage;
