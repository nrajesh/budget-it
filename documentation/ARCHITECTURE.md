# Architecture

## System Overview

### Web Application Architecture

```mermaid
graph TB
    subgraph Browser["🌐 Browser"]
        direction TB
        UI["React UI<br/>(Shadcn + Tailwind)"]
        Router["React Router<br/>(SPA Navigation)"]
        State["TanStack Query<br/>(State & Cache)"]
        Contexts["Context Providers<br/>(Ledger · Transactions · Filter<br/>Currency · Theme · User)"]
        DB["Dexie.js<br/>(IndexedDB Wrapper)"]
        IDB[("IndexedDB<br/>Local Storage")]
    end

    UI --> Router
    Router --> Contexts
    Contexts --> State
    State --> DB
    DB --> IDB

    style Browser fill:#1a1a2e,stroke:#16213e,color:#e8e8e8
    style UI fill:#61DAFB,stroke:#20232A,color:#000
    style Router fill:#f44250,stroke:#20232A,color:#fff
    style State fill:#ff4154,stroke:#20232A,color:#fff
    style Contexts fill:#764abc,stroke:#20232A,color:#fff
    style DB fill:#ff6f00,stroke:#20232A,color:#fff
    style IDB fill:#2e7d32,stroke:#1b5e20,color:#fff
```

### Electron Desktop Architecture

```mermaid
graph TB
    subgraph Electron["🖥️ Electron Shell"]
        direction TB
        Main["Main Process<br/>(electron/main.ts)"]
        Preload["Preload Script<br/>(electron/preload.ts)"]

        subgraph Renderer["Renderer Process (Chromium)"]
            direction TB
            WebApp["React Web App<br/>(same as web version)"]
            Bridge["contextBridge API<br/>(window.electron)"]
        end

        IPC["IPC Channels"]
        FS["Node.js fs<br/>(Direct File System)"]
        Dialog["Native Dialogs<br/>(Folder Picker)"]
    end

    Main -->|"ipcMain.handle"| IPC
    IPC -->|"ipcRenderer.invoke"| Preload
    Preload -->|"contextBridge"| Bridge
    Bridge --> WebApp

    Main --> FS
    Main --> Dialog

    style Electron fill:#1a1a2e,stroke:#16213e,color:#e8e8e8
    style Main fill:#2f3241,stroke:#47475c,color:#9feaf9
    style Preload fill:#2f3241,stroke:#47475c,color:#9feaf9
    style Renderer fill:#0d1117,stroke:#30363d,color:#e8e8e8
    style WebApp fill:#61DAFB,stroke:#20232A,color:#000
    style Bridge fill:#f0db4f,stroke:#20232A,color:#000
    style IPC fill:#ff9800,stroke:#e65100,color:#000
    style FS fill:#2e7d32,stroke:#1b5e20,color:#fff
    style Dialog fill:#5c6bc0,stroke:#3949ab,color:#fff
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant UI as React UI
    participant TQ as TanStack Query
    participant Ctx as Context Providers
    participant Dex as Dexie.js
    participant IDB as IndexedDB

    U->>UI: Interact (add transaction, etc.)
    UI->>Ctx: Dispatch action
    Ctx->>TQ: Optimistic update (instant UI)
    Ctx->>Dex: Persist data
    Dex->>IDB: Write to local store
    IDB-->>Dex: Confirmation
    Dex-->>TQ: Invalidate & refetch
    TQ-->>UI: Render updated view
```

## Architectural Decisions
- [Date] [Decision Title]
    - **Context**: [Why was this decision made?]
    - **Decision**: [What was decided?]
    - **Consequences**: [What are the pros/cons?]
