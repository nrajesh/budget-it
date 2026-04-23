import type { Resource } from "i18next";

export const builtInLanguageOptions = [
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "nl", name: "Dutch (Nederlands)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
] as const;

export const resources: Resource = {
  en: {
    translation: {
      language: {
        label: "Language",
        english: "English",
        spanish: "Spanish",
        chinese: "Chinese (Mandarin)",
        tamil: "Tamil (தமிழ்)",
        dutch: "Dutch",
        removeCustomAria: "Remove {{name}}",
        removeCustomConfirm:
          'Remove custom language "{{name}}"? You can add it again from Language settings.',
        openLanguageSettings: "Language settings",
        customRemoved: "Custom language removed.",
      },
      layout: {
        nav: {
          dashboard: "Dashboard",
          calendar: "Calendar",
          analytics: "Analytics",
          insights: "Insights",
          transactions: "Transactions",
          accounts: "Accounts",
          categories: "Categories",
          vendors: "Vendors",
          currencies: "Currencies",
          aiProviders: "AI Providers",
          scheduled: "Scheduled",
          reports: "Reports",
          reportsEssential: "Essential",
          reportsAdvanced: "Advanced",
          budgets: "Budgets",
          ledger: "Ledger",
          data: "Data",
          backup: "Backup",
          donate: "Donate",
          settings: "Settings",
          logout: "Log out",
          myLedgers: "My Ledgers",
          languages: "Languages",
        },
        groups: {
          dashboards: "Dashboards",
          management: "Management",
          configure: "Configure",
          setup: "Setup",
        },
        footer: {
          tagline: "Privacy-first | Data local | Open sourced",
          heartLink: "Made with ❤️ for your financial freedom",
          githubAria: "Open Budget It on GitHub",
        },
      },
      dialogs: {
        common: {
          cancel: "Cancel",
          continue: "Continue",
          close: "Close",
          confirmAndImport: "Confirm & Import",
        },
        password: {
          label: "Password",
          placeholder: "Enter password",
          confirm: "Confirm",
        },
        recurrence: {
          titleEdit: "Edit Recurring Transaction",
          titleDeleteOne: "Delete Recurring Transaction",
          titleDeleteMany: "Delete Recurring Transactions",
          titleDeleteSelected: "Delete Selected Transactions",
          descriptionEdit:
            "This transaction is part of a recurring series. Do you want to save changes to just this occurrence or update the future schedule as well?",
          descriptionDeleteOne:
            "This transaction is part of a recurring series. Do you want to delete just this occurrence or this and all future occurrences?",
          descriptionDeleteMany:
            "You have selected {{count}} recurring transactions. Do you want to delete only these specific instances or also cancel their future schedules?",
          descriptionDeleteSelected:
            "You have selected {{count}} transactions. Some are part of a recurring series. Do you want to delete only selected instances (Current Only) or include future schedules for recurring ones (Current & Future)?",
          currentOnly: "Current Only",
          currentAndFuture: "Current & Future",
        },
        missingCurrency: {
          title: "Select Currency for New Accounts",
          description:
            "Some accounts are new and their currency could not be determined. Select the correct currency for each.",
          selectCurrency: "Select currency",
        },
        globalProgress: {
          processing: "Processing...",
          waitDescription: "Please wait while we process your request.",
          initializing: "Initializing...",
          complete: "Complete",
        },
        addEditTransaction: {
          tabs: {
            expense: "Expense",
            income: "Income",
          },
          actions: {
            autoCategorize: "Auto-Categorize",
            add: "Add Transaction",
            save: "Save Changes",
          },
          fields: {
            date: "Date",
            accountSending: "Account (Sending)",
            vendorReceiving: "Vendor / Account (Receiving)",
            category: "Category",
            subCategory: "Sub-category",
            amountSending: "Amount (Sending)",
            amountReceiving: "Amount (Receiving)",
            remarks: "Remarks",
            recurrenceFrequency: "Recurrence Frequency",
            recurrenceEndDate: "Recurrence End Date",
          },
          placeholders: {
            selectAccount: "Select an account...",
            searchAccounts: "Search accounts...",
            noAccountFound: "No account found.",
            selectVendorOrAccount: "Select a vendor or account...",
            searchGeneric: "Search...",
            noResults: "No results found.",
            selectCategory: "Select a category...",
            searchCategories: "Search categories...",
            noCategoryFound: "No category found.",
            selectOrCreate: "Select or create...",
            searchSubCategories: "Search sub-categories...",
            noSubCategoryFound: "No sub-category found.",
            amount: "0.00",
            recurrence: "Select recurrence frequency",
          },
          recurrenceOptions: {
            none: "None",
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            quarterly: "Quarterly",
            yearly: "Yearly",
          },
          helper: {
            recurrenceFrequency:
              "Set how often this transaction should repeat.",
            recurrenceEndDate:
              "The date after which this transaction will no longer recur.",
          },
          title: {
            add: "Add New Transaction",
            edit: "Edit Transaction",
          },
          description: {
            add: "Quickly add a new transaction to your records.",
            edit: "Modify the details of this transaction.",
          },
        },
      },
      helpTour: {
        start: "Start Help Tour",
        next: "Next",
        back: "Back",
        last: "Done",
        skip: "Skip",
      },
      transactions: {
        header: {
          title: "Transactions",
          subtitle: "Manage and track your financial activities",
          importCsv: "Import CSV",
          exportCsv: "Export CSV",
          detectTransfers: "Detect Transfers",
          cleanupDuplicates: "Cleanup Duplicates",
          categorizeMissing: "Categorize Missing",
          addTransaction: "Add Transaction",
        },
        toasts: {
          scheduleNotFound: {
            title: "Schedule Not Found",
            description: "The original schedule seems to have been deleted.",
          },
          cleanupComplete: {
            title: "Cleanup Complete",
            description: "Removed {{count}} duplicate transactions.",
          },
          noDuplicates: {
            title: "No Duplicates",
            description: "No duplicate transactions were found.",
          },
          cleanupFailed: {
            title: "Cleanup Failed",
            description: "An error occurred while removing duplicates.",
          },
          nothingToCategorize: {
            title: "Nothing to categorize",
            description: "No uncategorized vendors found.",
          },
          aiNotConfigured: {
            title: "AI Not Configured",
            description: "Please configure your AI provider and API key",
            action: "Go to AI Settings",
          },
          bulkCategorization: {
            title: "Bulk Categorization",
            description: "Categorized {{count}} transactions successfully.",
          },
          noChanges: {
            title: "No changes",
            description:
              "The AI could not confidently categorize any items or no valid mappings were returned.",
          },
          categorizationFailed: {
            title: "Categorization Failed",
            apiKeyHint: "Please check your API key or endpoint configuration.",
            genericHint: "An unexpected error occurred during categorization.",
          },
          unlinked: {
            title: "Transactions Unlinked",
            description: "The transfer link has been removed.",
          },
          linked: {
            title: "Transactions Linked",
            description: "The transactions have been paired as a transfer.",
          },
          filterUpdated: {
            title: "Filter Updated",
            description:
              'Added "{{accountName}}" to your view so you can see the new transaction.',
          },
          scheduleUpdated: {
            title: "Schedule Updated",
            description: "The recurring transaction has been updated.",
          },
          scheduleCreated: {
            title: "Schedule Created",
            description: "A new recurring transaction has been scheduled.",
          },
          scheduleSaveError: {
            title: "Error",
            description: "Failed to save schedule.",
          },
        },
        confirmations: {
          removeDuplicatesTitle: "Remove Duplicate Transactions?",
          removeDuplicatesDescription:
            "This scans for transactions with identical recurrence IDs on the same date and removes duplicates. This action cannot be undone.",
          cleaning: "Cleaning...",
          removeDuplicatesAction: "Remove Duplicates",
          unlinkTitle: "Unlink Transactions?",
          unlinkDescription:
            "Are you sure you want to break the link between these transactions? They will no longer be treated as a transfer pair.",
          unlinkAction: "Unlink",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Default Currency",
            description: "Select your preferred currency for display.",
          },
          ledger: {
            title: "Ledger Settings",
            description:
              "Manage your current ledger details or create a new one.",
            edit: "Edit Current Ledger",
            create: "Create New Ledger",
          },
          future: {
            title: "Future Transactions",
            description:
              "Define how many months of future scheduled transactions to show.",
            months: "months",
          },
          language: {
            title: "Language and Localization",
            description:
              "Use one primary language (mother tongue). Add custom languages by code and translation JSON.",
            active: "Active Language",
            enabled: "Enabled Languages",
            customTitle: "Add Custom Language",
            codePlaceholder: "Language code (e.g. de, ja, hi)",
            namePlaceholder: "Display name (e.g. German)",
            jsonLabel:
              "Translation JSON for this language (root = translation keys)",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Save Custom Language",
            deleteActiveHint:
              "Custom languages can be deleted with the trash icon. If you remove the language you are using, the app switches to a fallback (English when available, or another supported language that matches your browser).",
          },
        },
      },
      test: {
        draftLabel: "Draft Note",
      },
      tour: {
        home: {
          "0": {
            content:
              "This is your main dashboard summary showing your financial health at a glance.",
          },
        },
        language: {
          "0": {
            content:
              "Choose how Budget It speaks to you. Pick your primary language or add a custom translation bundle.",
          },
          "1": {
            content:
              "Select one built-in language as your primary UI language. The interface updates instantly without losing your data.",
          },
          "2": {
            content:
              "Need a locale we do not ship? Add a code, display name, and translation JSON to extend the app.",
          },
        },
      },
    },
  },
  es: {
    translation: {
      language: {
        label: "Idioma",
        english: "Ingles",
        spanish: "Espanol",
        chinese: "Chino (Mandarin)",
        tamil: "Tamil (தமிழ்)",
        dutch: "Neerlandés",
        removeCustomAria: "Quitar {{name}}",
        removeCustomConfirm:
          '¿Quitar el idioma personalizado "{{name}}"? Puedes volver a agregarlo en Idioma.',
        openLanguageSettings: "Ajustes de idioma",
        customRemoved: "Idioma personalizado eliminado.",
      },
      layout: {
        nav: {
          dashboard: "Tablero",
          calendar: "Calendario",
          analytics: "Analiticas",
          insights: "Ideas",
          transactions: "Transacciones",
          accounts: "Cuentas",
          categories: "Categorias",
          vendors: "Proveedores",
          currencies: "Monedas",
          aiProviders: "Proveedores de IA",
          scheduled: "Programado",
          reports: "Informes",
          reportsEssential: "Esencial",
          reportsAdvanced: "Avanzado",
          budgets: "Presupuestos",
          ledger: "Libro",
          data: "Datos",
          backup: "Copia de seguridad",
          donate: "Donar",
          settings: "Configuracion",
          logout: "Cerrar sesion",
          myLedgers: "Mis libros",
          languages: "Idiomas",
        },
        groups: {
          dashboards: "Paneles",
          management: "Gestion",
          configure: "Configurar",
          setup: "Configuracion",
        },
        footer: {
          tagline: "Privacidad primero | Datos locales | Codigo abierto",
          heartLink: "Hecho con ❤️ para tu libertad financiera",
          githubAria: "Abrir Budget It en GitHub",
        },
      },
      dialogs: {
        common: {
          cancel: "Cancelar",
          continue: "Continuar",
          close: "Cerrar",
          confirmAndImport: "Confirmar e importar",
        },
        password: {
          label: "Contrasena",
          placeholder: "Ingrese contrasena",
          confirm: "Confirmar",
        },
        recurrence: {
          titleEdit: "Editar transaccion recurrente",
          titleDeleteOne: "Eliminar transaccion recurrente",
          titleDeleteMany: "Eliminar transacciones recurrentes",
          titleDeleteSelected: "Eliminar transacciones seleccionadas",
          descriptionEdit:
            "Esta transaccion forma parte de una serie recurrente. Desea guardar cambios solo para esta ocurrencia o actualizar tambien la programacion futura?",
          descriptionDeleteOne:
            "Esta transaccion forma parte de una serie recurrente. Desea eliminar solo esta ocurrencia o tambien todas las futuras?",
          descriptionDeleteMany:
            "Ha seleccionado {{count}} transacciones recurrentes. Desea eliminar solo estas instancias o tambien cancelar la programacion futura?",
          descriptionDeleteSelected:
            "Ha seleccionado {{count}} transacciones. Algunas forman parte de una serie recurrente. Desea eliminar solo las instancias seleccionadas o incluir tambien las futuras?",
          currentOnly: "Solo actual",
          currentAndFuture: "Actual y futuras",
        },
        missingCurrency: {
          title: "Seleccionar moneda para nuevas cuentas",
          description:
            "Algunas cuentas son nuevas y no se pudo determinar su moneda. Seleccione la moneda correcta para cada una.",
          selectCurrency: "Seleccionar moneda",
        },
        globalProgress: {
          processing: "Procesando...",
          waitDescription: "Espere mientras procesamos su solicitud.",
          initializing: "Inicializando...",
          complete: "Completado",
        },
        addEditTransaction: {
          tabs: {
            expense: "Gasto",
            income: "Ingreso",
          },
          actions: {
            autoCategorize: "Auto-categorizar",
            add: "Agregar transaccion",
            save: "Guardar cambios",
          },
          fields: {
            date: "Fecha",
            accountSending: "Cuenta (envio)",
            vendorReceiving: "Proveedor / Cuenta (recepcion)",
            category: "Categoria",
            subCategory: "Subcategoria",
            amountSending: "Monto (envio)",
            amountReceiving: "Monto (recepcion)",
            remarks: "Comentarios",
            recurrenceFrequency: "Frecuencia de recurrencia",
            recurrenceEndDate: "Fecha final de recurrencia",
          },
          placeholders: {
            selectAccount: "Seleccione una cuenta...",
            searchAccounts: "Buscar cuentas...",
            noAccountFound: "No se encontro una cuenta.",
            selectVendorOrAccount: "Seleccione un proveedor o cuenta...",
            searchGeneric: "Buscar...",
            noResults: "No hay resultados.",
            selectCategory: "Seleccione una categoria...",
            searchCategories: "Buscar categorias...",
            noCategoryFound: "No se encontro una categoria.",
            selectOrCreate: "Seleccionar o crear...",
            searchSubCategories: "Buscar subcategorias...",
            noSubCategoryFound: "No se encontro una subcategoria.",
            amount: "0.00",
            recurrence: "Seleccione frecuencia de recurrencia",
          },
          recurrenceOptions: {
            none: "Ninguna",
            daily: "Diaria",
            weekly: "Semanal",
            monthly: "Mensual",
            quarterly: "Trimestral",
            yearly: "Anual",
          },
          helper: {
            recurrenceFrequency:
              "Defina con que frecuencia debe repetirse esta transaccion.",
            recurrenceEndDate:
              "La fecha despues de la cual esta transaccion dejara de repetirse.",
          },
          title: {
            add: "Agregar nueva transaccion",
            edit: "Editar transaccion",
          },
          description: {
            add: "Agrega rapidamente una nueva transaccion a tus registros.",
            edit: "Modifica los detalles de esta transaccion.",
          },
        },
      },
      helpTour: {
        start: "Iniciar recorrido de ayuda",
        next: "Siguiente",
        back: "Atras",
        last: "Finalizar",
        skip: "Omitir",
      },
      transactions: {
        header: {
          title: "Transacciones",
          subtitle: "Gestiona y sigue tus actividades financieras",
          importCsv: "Importar CSV",
          exportCsv: "Exportar CSV",
          detectTransfers: "Detectar transferencias",
          cleanupDuplicates: "Limpiar duplicados",
          categorizeMissing: "Categorizar faltantes",
          addTransaction: "Agregar transaccion",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Moneda predeterminada",
            description: "Selecciona tu moneda preferida para mostrar.",
          },
          ledger: {
            title: "Configuracion del libro",
            description:
              "Administra los detalles de tu libro actual o crea uno nuevo.",
            edit: "Editar libro actual",
            create: "Crear nuevo libro",
          },
          future: {
            title: "Transacciones futuras",
            description:
              "Define cuántos meses de transacciones programadas futuras mostrar.",
            months: "meses",
          },
          language: {
            title: "Idioma y localizacion",
            description:
              "Usa un solo idioma principal (lengua materna). Agrega idiomas personalizados con codigo y JSON de traduccion.",
            active: "Idioma activo",
            enabled: "Idiomas habilitados",
            customTitle: "Agregar idioma personalizado",
            codePlaceholder: "Codigo de idioma (ej. de, ja, hi)",
            namePlaceholder: "Nombre para mostrar (ej. Aleman)",
            jsonLabel: "JSON de traduccion para este idioma",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Guardar idioma personalizado",
            deleteActiveHint:
              "Los idiomas personalizados se pueden eliminar con el icono de papelera. Si quitas el idioma activo, la app pasa a un idioma de respaldo (ingles si esta disponible, u otro idioma admitido segun tu navegador).",
          },
        },
      },
      test: {
        draftLabel: "Nota de borrador",
      },
      tour: {
        home: {
          "0": {
            content:
              "Este es tu resumen del tablero principal que muestra tu salud financiera de un vistazo.",
          },
        },
        language: {
          "0": {
            content:
              "Elige como te habla Budget It. Selecciona tu idioma principal o agrega un paquete de traduccion personalizado.",
          },
          "1": {
            content:
              "Elige un idioma integrado como idioma principal de la interfaz. La interfaz se actualiza al instante sin perder tus datos.",
          },
          "2": {
            content:
              "¿Necesitas una variante que no incluimos? Agrega codigo, nombre visible y JSON de traduccion para ampliar la app.",
          },
        },
      },
    },
  },
  zh: {
    translation: {
      language: {
        label: "语言",
        english: "英语",
        spanish: "西班牙语",
        chinese: "中文（普通话）",
        tamil: "泰米尔语",
        dutch: "荷兰语",
        removeCustomAria: "移除 {{name}}",
        removeCustomConfirm:
          "要移除自定义语言“{{name}}”吗？可在语言设置中重新添加。",
        openLanguageSettings: "语言设置",
        customRemoved: "已移除自定义语言。",
      },
      layout: {
        nav: {
          dashboard: "仪表盘",
          calendar: "日历",
          analytics: "分析",
          insights: "洞察",
          transactions: "Transactions",
          accounts: "账户",
          categories: "分类",
          vendors: "商家",
          currencies: "货币",
          aiProviders: "AI 提供商",
          scheduled: "计划",
          reports: "报表",
          reportsEssential: "基础",
          reportsAdvanced: "高级",
          budgets: "预算",
          ledger: "账本",
          data: "数据",
          backup: "备份",
          donate: "捐赠",
          settings: "设置",
          logout: "退出",
          myLedgers: "我的账本",
          languages: "语言",
        },
        footer: {
          tagline: "隐私优先 | 数据本地 | 开源",
          heartLink: "用 ❤️ 助你实现财务自由",
          githubAria: "在 GitHub 上打开 Budget It",
        },
      },
      dialogs: {
        common: {
          cancel: "取消",
          continue: "继续",
          close: "关闭",
          confirmAndImport: "确认并导入",
        },
        password: {
          label: "密码",
          placeholder: "请输入密码",
          confirm: "确认",
        },
        recurrence: {
          titleEdit: "编辑周期性交易",
          titleDeleteOne: "删除周期性交易",
          titleDeleteMany: "删除周期性交易",
          titleDeleteSelected: "删除已选交易",
          descriptionEdit:
            "此交易属于周期性系列。仅更新当前这笔，还是同时更新未来计划？",
          descriptionDeleteOne:
            "此交易属于周期性系列。仅删除当前这笔，还是同时删除未来发生项？",
          descriptionDeleteMany:
            "你已选择 {{count}} 笔周期性交易。仅删除当前项，还是同时取消未来计划？",
          descriptionDeleteSelected:
            "你已选择 {{count}} 笔交易，其中一些属于周期性系列。仅删除当前项，还是包含未来项？",
          currentOnly: "仅当前",
          currentAndFuture: "当前及未来",
        },
        missingCurrency: {
          title: "为新账户选择币种",
          description:
            "部分账户是新建的，系统无法确定其币种。请为每个账户选择正确币种。",
          selectCurrency: "选择币种",
        },
        globalProgress: {
          processing: "处理中...",
          waitDescription: "请稍候，我们正在处理你的请求。",
          initializing: "初始化中...",
          complete: "完成",
        },
        addEditTransaction: {
          fields: {
            accountSending: "Compte (envoi)",
          },
          title: {
            add: "Ajouter une nouvelle transaction",
            edit: "Modifier la transaction",
          },
        },
      },
      helpTour: {
        start: "开始帮助引导",
        next: "下一步",
        back: "上一步",
        last: "完成",
        skip: "跳过",
      },
      test: {
        draftLabel: "草稿备注",
      },
      tour: {
        language: {
          "0": {
            content: "在此选择 Budget It 的界面语言，或添加自定义翻译包。",
          },
          "1": {
            content:
              "选择一个内置语言作为界面主语言；切换会立即生效，不会丢失数据。",
          },
          "2": {
            content:
              "需要未内置的语言？填写语言代码、显示名称和翻译 JSON 即可扩展应用。",
          },
        },
      },
    },
  },
  nl: {
    translation: {
      language: {
        label: "Taal",
        english: "Engels",
        spanish: "Spaans",
        chinese: "Chinees (Mandarijn)",
        tamil: "Tamil (தமிழ்)",
        dutch: "Nederlands",
        removeCustomAria: "{{name}} verwijderen",
        removeCustomConfirm:
          'Aangepaste taal "{{name}}" verwijderen? Je kunt deze opnieuw toevoegen via Taalinstellingen.',
        openLanguageSettings: "Taalinstellingen",
        customRemoved: "Aangepaste taal verwijderd.",
      },
      layout: {
        nav: {
          dashboard: "Dashboard",
          calendar: "Kalender",
          analytics: "Analytics",
          insights: "Inzichten",
          transactions: "Transacties",
          accounts: "Rekeningen",
          categories: "Categorieën",
          vendors: "Leveranciers",
          currencies: "Valuta",
          aiProviders: "AI-providers",
          scheduled: "Gepland",
          reports: "Rapporten",
          reportsEssential: "Essentieel",
          reportsAdvanced: "Geavanceerd",
          budgets: "Budgetten",
          ledger: "Grootboek",
          data: "Gegevens",
          backup: "Back-up",
          donate: "Doneren",
          settings: "Instellingen",
          logout: "Afmelden",
          myLedgers: "Mijn grootboeken",
          languages: "Talen",
        },
        groups: {
          dashboards: "Dashboards",
          management: "Beheer",
          configure: "Configureren",
          setup: "Instellen",
        },
        footer: {
          tagline: "Privacy eerst | Gegevens lokaal | Open source",
          heartLink: "Met ❤️ gemaakt voor jouw financiële vrijheid",
          githubAria: "Budget It openen op GitHub",
        },
      },
      dialogs: {
        common: {
          cancel: "Annuleren",
          continue: "Doorgaan",
          close: "Sluiten",
          confirmAndImport: "Bevestigen en importeren",
        },
        password: {
          label: "Wachtwoord",
          placeholder: "Voer wachtwoord in",
          confirm: "Bevestigen",
        },
        recurrence: {
          titleEdit: "Terugkerende transactie bewerken",
          titleDeleteOne: "Terugkerende transactie verwijderen",
          titleDeleteMany: "Terugkerende transacties verwijderen",
          titleDeleteSelected: "Geselecteerde transacties verwijderen",
          descriptionEdit:
            "Deze transactie maakt deel uit van een terugkerende reeks. Wil je wijzigingen alleen voor deze keer opslaan of ook het toekomstige schema bijwerken?",
          descriptionDeleteOne:
            "Deze transactie maakt deel uit van een terugkerende reeks. Wil je alleen deze keer verwijderen of ook alle toekomstige keren?",
          descriptionDeleteMany:
            "Je hebt {{count}} terugkerende transacties geselecteerd. Wil je alleen deze specifieke instanties verwijderen of ook hun toekomstige schema's annuleren?",
          descriptionDeleteSelected:
            "Je hebt {{count}} transacties geselecteerd. Sommige maken deel uit van een terugkerende reeks. Wil je alleen de geselecteerde instanties verwijderen (Alleen huidige) of ook toekomstige schema's voor terugkerende transacties (Huidig en toekomstig)?",
          currentOnly: "Alleen huidige",
          currentAndFuture: "Huidig en toekomstig",
        },
        missingCurrency: {
          title: "Valuta selecteren voor nieuwe rekeningen",
          description:
            "Sommige rekeningen zijn nieuw en hun valuta kon niet worden bepaald. Selecteer voor elke rekening de juiste valuta.",
          selectCurrency: "Valuta selecteren",
        },
        globalProgress: {
          processing: "Bezig met verwerken...",
          waitDescription: "Even geduld terwijl we je verzoek verwerken.",
          initializing: "Initialiseren...",
          complete: "Voltooid",
        },
        addEditTransaction: {
          tabs: {
            expense: "Uitgave",
            income: "Inkomsten",
          },
          actions: {
            autoCategorize: "Automatisch categoriseren",
            add: "Transactie toevoegen",
            save: "Wijzigingen opslaan",
          },
          fields: {
            date: "Datum",
            accountSending: "Rekening (afzender)",
            vendorReceiving: "Leverancier / rekening (ontvanger)",
            category: "Categorie",
            subCategory: "Subcategorie",
            amountSending: "Bedrag (afzender)",
            amountReceiving: "Bedrag (ontvanger)",
            remarks: "Opmerkingen",
            recurrenceFrequency: "Herhalingsfrequentie",
            recurrenceEndDate: "Einddatum herhaling",
          },
          placeholders: {
            selectAccount: "Selecteer een rekening...",
            searchAccounts: "Zoek rekeningen...",
            noAccountFound: "Geen rekening gevonden.",
            selectVendorOrAccount: "Selecteer leverancier of rekening...",
            searchGeneric: "Zoeken...",
            noResults: "Geen resultaten gevonden.",
            selectCategory: "Selecteer een categorie...",
            searchCategories: "Zoek categorieën...",
            noCategoryFound: "Geen categorie gevonden.",
            selectOrCreate: "Selecteer of maak...",
            searchSubCategories: "Zoek subcategorieën...",
            noSubCategoryFound: "Geen subcategorie gevonden.",
            amount: "0,00",
            recurrence: "Selecteer herhalingsfrequentie",
          },
          recurrenceOptions: {
            none: "Geen",
            daily: "Dagelijks",
            weekly: "Wekelijks",
            monthly: "Maandelijks",
            quarterly: "Per kwartaal",
            yearly: "Jaarlijks",
          },
          helper: {
            recurrenceFrequency:
              "Stel in hoe vaak deze transactie moet worden herhaald.",
            recurrenceEndDate:
              "De datum na welke deze transactie niet meer wordt herhaald.",
          },
          title: {
            add: "Nieuwe transactie toevoegen",
            edit: "Transactie bewerken",
          },
          description: {
            add: "Voeg snel een nieuwe transactie toe aan je administratie.",
            edit: "Pas de gegevens van deze transactie aan.",
          },
        },
      },
      helpTour: {
        start: "Hulp-rondleiding starten",
        next: "Volgende",
        back: "Terug",
        last: "Klaar",
        skip: "Overslaan",
      },
      transactions: {
        header: {
          title: "Transacties",
          subtitle: "Beheer en volg je financiële activiteiten",
          importCsv: "CSV importeren",
          exportCsv: "CSV exporteren",
          detectTransfers: "Overschrijvingen detecteren",
          cleanupDuplicates: "Duplicaten opschonen",
          categorizeMissing: "Ontbrekende categoriseren",
          addTransaction: "Transactie toevoegen",
        },
        toasts: {
          scheduleNotFound: {
            title: "Schema niet gevonden",
            description: "Het oorspronkelijke schema lijkt te zijn verwijderd.",
          },
          cleanupComplete: {
            title: "Opschonen voltooid",
            description: "{{count}} dubbele transacties verwijderd.",
          },
          noDuplicates: {
            title: "Geen duplicaten",
            description: "Er zijn geen dubbele transacties gevonden.",
          },
          cleanupFailed: {
            title: "Opschonen mislukt",
            description:
              "Er is een fout opgetreden bij het verwijderen van duplicaten.",
          },
          nothingToCategorize: {
            title: "Niets te categoriseren",
            description: "Geen niet-gecategoriseerde leveranciers gevonden.",
          },
          aiNotConfigured: {
            title: "AI niet geconfigureerd",
            description: "Configureer je AI-provider en API-sleutel",
            action: "Naar AI-instellingen",
          },
          bulkCategorization: {
            title: "Bulkcategorisatie",
            description: "{{count}} transacties succesvol gecategoriseerd.",
          },
          noChanges: {
            title: "Geen wijzigingen",
            description:
              "De AI kon geen items met vertrouwen categoriseren of er werden geen geldige koppelingen teruggestuurd.",
          },
          categorizationFailed: {
            title: "Categorisatie mislukt",
            apiKeyHint: "Controleer je API-sleutel of endpointconfiguratie.",
            genericHint:
              "Er is een onverwachte fout opgetreden bij categorisatie.",
          },
          unlinked: {
            title: "Transacties ontkoppeld",
            description: "De overschrijvingskoppeling is verwijderd.",
          },
          linked: {
            title: "Transacties gekoppeld",
            description: "De transacties zijn als overschrijving gekoppeld.",
          },
          filterUpdated: {
            title: "Filter bijgewerkt",
            description:
              '"{{accountName}}" toegevoegd aan je weergave zodat je de nieuwe transactie ziet.',
          },
          scheduleUpdated: {
            title: "Schema bijgewerkt",
            description: "De terugkerende transactie is bijgewerkt.",
          },
          scheduleCreated: {
            title: "Schema aangemaakt",
            description: "Er is een nieuwe terugkerende transactie gepland.",
          },
          scheduleSaveError: {
            title: "Fout",
            description: "Schema opslaan mislukt.",
          },
        },
        confirmations: {
          removeDuplicatesTitle: "Dubbele transacties verwijderen?",
          removeDuplicatesDescription:
            "Zoekt transacties met dezelfde terugkerings-ID op dezelfde datum en verwijdert duplicaten. Deze actie kan niet ongedaan worden gemaakt.",
          cleaning: "Opschonen...",
          removeDuplicatesAction: "Duplicaten verwijderen",
          unlinkTitle: "Transacties ontkoppelen?",
          unlinkDescription:
            "Weet je zeker dat je de koppeling tussen deze transacties wilt verbreken? Ze worden niet meer als overschrijvingspaar behandeld.",
          unlinkAction: "Ontkoppelen",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "Standaardvaluta",
            description: "Selecteer je voorkeursvaluta voor weergave.",
          },
          ledger: {
            title: "Grootboekinstellingen",
            description:
              "Beheer de gegevens van je huidige grootboek of maak een nieuw grootboek.",
            edit: "Huidig grootboek bewerken",
            create: "Nieuw grootboek maken",
          },
          future: {
            title: "Toekomstige transacties",
            description:
              "Bepaal hoeveel maanden aan toekomstige geplande transacties worden getoond.",
            months: "maanden",
          },
          language: {
            title: "Taal en lokalisatie",
            description:
              "Gebruik één primaire taal (moedertaal). Voeg aangepaste talen toe via code en vertaal-JSON.",
            active: "Actieve taal",
            enabled: "Ingeschakelde talen",
            customTitle: "Aangepaste taal toevoegen",
            codePlaceholder: "Taalcode (bijv. de, ja, hi)",
            namePlaceholder: "Weergavenaam (bijv. Duits)",
            jsonLabel:
              "Vertaal-JSON voor deze taal (root = vertaalsleutels)",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "Aangepaste taal opslaan",
            deleteActiveHint:
              "Aangepaste talen kun je met het prullenbakpictogram verwijderen. Als je de taal die je gebruikt verwijdert, schakelt de app over naar een reserve (Engels als beschikbaar, of een andere ondersteunde taal die bij je browser past).",
          },
        },
      },
      test: {
        draftLabel: "Conceptnotitie",
      },
      tour: {
        home: {
          "0": {
            content:
              "Dit is je hoofd-dashboardoverzicht met in één oogopslag je financiële gezondheid.",
          },
        },
        language: {
          "0": {
            content:
              "Kies hoe Budget It met je communiceert. Kies je primaire taal of voeg een aangepast vertaalpakket toe.",
          },
          "1": {
            content:
              "Kies één ingebouwde taal als primaire interface-taal. De interface wordt direct bijgewerkt zonder je gegevens te verliezen.",
          },
          "2": {
            content:
              "Heb je een locale die we niet meeleveren? Voeg een code, weergavenaam en vertaal-JSON toe om de app uit te breiden.",
          },
        },
      },
    },
  },
  ta: {
    translation: {
      language: {
        label: "மொழி",
        english: "ஆங்கிலம்",
        spanish: "ஸ்பானிஷ்",
        chinese: "சீனம் (மாண்டரின்)",
        tamil: "தமிழ்",
        dutch: "டச்",
        removeCustomAria: "{{name}} ஐ நீக்கு",
        removeCustomConfirm:
          'தனிப்பயன் மொழி "{{name}}" ஐ நீக்கவா? மொழி அமைப்புகளில் மீண்டும் சேர்க்கலாம்.',
        openLanguageSettings: "மொழி அமைப்புகள்",
        customRemoved: "தனிப்பயன் மொழி நீக்கப்பட்டது.",
      },
      layout: {
        nav: {
          dashboard: "டாஷ்போர்டு",
          calendar: "காலண்டர்",
          analytics: "பகுப்பாய்வு",
          insights: "உள்ளடக்கம்",
          transactions: "பரிவர்த்தனைகள்",
          accounts: "கணக்குகள்",
          categories: "வகைகள்",
          vendors: "விற்பனையாளர்கள்",
          currencies: "நாணயங்கள்",
          aiProviders: "AI வழங்குநர்கள்",
          scheduled: "திட்டமிடப்பட்டது",
          reports: "அறிக்கைகள்",
          reportsEssential: "அடிப்படை",
          reportsAdvanced: "மேம்பட்டது",
          budgets: "பட்ஜெட்டுகள்",
          ledger: "லெட்ஜர்",
          data: "தரவு",
          backup: "காப்புப்பிரதி",
          donate: "நன்கொடை",
          settings: "அமைப்புகள்",
          logout: "வெளியேறு",
          myLedgers: "என் லெட்ஜர்கள்",
          languages: "மொழிகள்",
        },
        groups: {
          dashboards: "சுருக்கங்கள்",
          management: "மேலாண்மை",
          configure: "அமைவு",
          setup: "தொடக்கம்",
        },
        footer: {
          tagline: "தனியுரிமை முதலில் | தரவு உள்ளமை | திறந்த மூலம்",
          heartLink: "உங்கள் நிதி சுதந்திரத்திற்காக ❤️ உடன் உருவாக்கப்பட்டது",
          githubAria: "GitHub இல் Budget It ஐ திறக்கவும்",
        },
      },
      dialogs: {
        addEditTransaction: {
          tabs: {
            expense: "செலவு",
            income: "வருமானம்",
          },
          actions: {
            autoCategorize: "தானியங்கு வகைப்படுத்து",
            add: "பரிவர்த்தனை சேர்க்கவும்",
            save: "மாற்றங்களை சேமிக்கவும்",
          },
          fields: {
            date: "தேதி",
            accountSending: "கணக்கு (அனுப்புவது)",
            vendorReceiving: "விற்பனையாளர் / கணக்கு (பெறுவது)",
            category: "வகை",
            subCategory: "துணை வகை",
            amountSending: "தொகை (அனுப்புவது)",
            amountReceiving: "தொகை (பெறுவது)",
            remarks: "குறிப்புகள்",
            recurrenceFrequency: "மீள்வது எத்தனை முறை",
            recurrenceEndDate: "மீளும் இறுதி தேதி",
          },
          placeholders: {
            selectAccount: "கணக்கை தேர்ந்தெடுக்கவும்...",
            searchAccounts: "கணக்குகளை தேடவும்...",
            noAccountFound: "கணக்கு கிடைக்கவில்லை.",
            selectVendorOrAccount:
              "விற்பனையாளர் அல்லது கணக்கை தேர்ந்தெடுக்கவும்...",
            searchGeneric: "தேடவும்...",
            noResults: "முடிவுகள் இல்லை.",
            selectCategory: "வகையை தேர்ந்தெடுக்கவும்...",
            searchCategories: "வகைகளை தேடவும்...",
            noCategoryFound: "வகை கிடைக்கவில்லை.",
            selectOrCreate: "தேர்ந்தெடுக்கவும் அல்லது உருவாக்கவும்...",
            searchSubCategories: "துணை வகைகளை தேடவும்...",
            noSubCategoryFound: "துணை வகை கிடைக்கவில்லை.",
            amount: "0.00",
            recurrence: "மீள்வதை தேர்ந்தெடுக்கவும்",
          },
          recurrenceOptions: {
            none: "இல்லை",
            daily: "தினசரி",
            weekly: "வாராந்திர",
            monthly: "மாதாந்திர",
            quarterly: "காலாண்டு",
            yearly: "வருடாந்திர",
          },
          helper: {
            recurrenceFrequency:
              "இந்த பரிவர்த்தனை எவ்வளவு அடிக்கடி மீள வேண்டும் என்பதை அமைக்கவும்.",
            recurrenceEndDate: "இந்த தேதிக்குப் பிறகு இந்த பரிவர்த்தனை மீளாது.",
          },
          title: {
            add: "புதிய பரிவர்த்தனை சேர்க்கவும்",
            edit: "பரிவர்த்தனையை திருத்தவும்",
          },
          description: {
            add: "உங்கள் பதிவுகளில் புதிய பரிவர்த்தனையை விரைவாக சேர்க்கவும்.",
            edit: "இந்த பரிவர்த்தனையின் விவரங்களை மாற்றவும்.",
          },
        },
      },
      helpTour: {
        start: "உதவி சுற்றுப்பயணம் தொடங்கு",
        next: "அடுத்து",
        back: "பின்பு",
        last: "முடி",
        skip: "தவிர்",
      },
      transactions: {
        header: {
          title: "பரிவர்த்தனைகள்",
          subtitle: "உங்கள் நிதி செயல்பாடுகளை நிர்வகித்து கண்காணிக்கவும்",
          importCsv: "CSV இறக்குமதி",
          exportCsv: "CSV ஏற்றுமதி",
          detectTransfers: "பரிமாற்றங்களை கண்டறி",
          cleanupDuplicates: "நகல்களை அகற்று",
          categorizeMissing: "வகைப்படுத்தப்படாதவற்றை வகைப்படுத்து",
          addTransaction: "பரிவர்த்தனை சேர்க்கவும்",
        },
      },
      settings: {
        cards: {
          currency: {
            title: "இயல்புநிலை நாணயம்",
            description: "காட்சிக்கு விருப்பமான நாணயத்தை தேர்ந்தெடுக்கவும்.",
          },
          ledger: {
            title: "லெட்ஜர் அமைப்புகள்",
            description:
              "தற்போதைய லெட்ஜர் விவரங்களை நிர்வகிக்கவும் அல்லது புதியதை உருவாக்கவும்.",
            edit: "தற்போதைய லெட்ஜரை திருத்து",
            create: "புதிய லெட்ஜர் உருவாக்கு",
          },
          future: {
            title: "எதிர்கால பரிவர்த்தனைகள்",
            description:
              "எத்தனை மாத எதிர்கால திட்டமிட்ட பரிவர்த்தனைகள் காட்ட வேண்டும் என்பதைக் குறிப்பிடவும்.",
            months: "மாதங்கள்",
          },
          language: {
            title: "மொழி மற்றும் உள்ளூர்மயமாக்கல்",
            description:
              "ஒரே முதன்மை மொழியை (தாய்மொழி) பயன்படுத்தவும். மொழிக் குறியீடு மற்றும் மொழிபெயர்ப்பு JSON மூலம் தனிப்பயன் மொழிகளை சேர்க்கலாம்.",
            active: "செயலில் உள்ள மொழி",
            enabled: "இயக்கப்பட்ட மொழிகள்",
            customTitle: "தனிப்பயன் மொழி சேர்க்கவும்",
            codePlaceholder: "மொழிக் குறியீடு (எ.கா. de, ja, hi)",
            namePlaceholder: "காட்சி பெயர் (எ.கா. ஜெர்மன்)",
            jsonLabel: "இந்த மொழிக்கான மொழிபெயர்ப்பு JSON",
            jsonPlaceholder: '{"layout":{"nav":{"dashboard":"..."}}}',
            save: "தனிப்பயன் மொழியை சேமி",
            deleteActiveHint:
              "தனிப்பயன் மொழிகளை குப்பை ஐகான் மூலம் நீக்கலாம். நீங்கள் பயன்படுத்தும் மொழியை நீக்கினால், பயன்பாடு கிடைக்கும் மொழிக்கு மாறும் (ஆங்கிலம் கிடைத்தால் அது, இல்லையெனில் உலாவி மொழிக்கு பொருந்தும் ஆதரவு மொழி).",
          },
        },
      },
      test: {
        draftLabel: "வரைவு குறிப்பு",
      },
      tour: {
        home: {
          "0": {
            content:
              "இது உங்கள் முக்கிய டாஷ்போர்டு சுருக்கம், உங்கள் நிதி நிலையை ஒரு பார்வையில் காட்டுகிறது.",
          },
        },
        language: {
          "0": {
            content:
              "Budget It உங்களிடம் எப்படி பேச வேண்டும் என்பதை இங்கே தேர்ந்தெடுக்கவும். முதன்மை மொழியைத் தேர்ந்தெடுக்கவும் அல்லது தனிப்பயன் மொழிபெயர்ப்பைச் சேர்க்கவும்.",
          },
          "1": {
            content:
              "உள்ளமைக்கப்பட்ட மொழிகளில் ஒன்றை முதன்மை இடைமுக மொழியாகத் தேர்ந்தெடுக்கவும். தரவு இழப்பின்றி உடனடியாக புதுப்பிக்கப்படும்.",
          },
          "2": {
            content:
              "நாங்கள் வழங்காத மொழி வேண்டுமா? குறியீடு, காட்சி பெயர் மற்றும் மொழிபெயர்ப்பு JSON மூலம் பயன்பாட்டை விரிவாக்கலாம்.",
          },
        },
      },
    },
  },
};

export const supportedLanguages = ["en", "es", "zh", "nl", "ta"] as const;
export type SupportedLanguage = string;
