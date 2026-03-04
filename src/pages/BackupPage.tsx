import ScheduledBackups from "@/components/backup/ScheduledBackups";

const BackupPage = () => {
  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
            Backup
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Configure automated backups for your peace of mind.
          </p>
        </div>
      </div>

      <ScheduledBackups />
    </div>
  );
};

export default BackupPage;
