import { useState } from "react";
import { acknowledgments } from "@/data/acknowledgments.generated";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";

export default function AcknowledgmentsPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="app-page-header">
        <h1 className="app-gradient-title app-page-title">
          Open Source Licenses
        </h1>
        <p className="app-page-subtitle">
          Vaulted Money is built on the work of many open-source projects. The
          libraries below are bundled in this app under their respective
          licenses.
        </p>
      </div>

      <div className="grid gap-4">
        {acknowledgments.map((ack) => {
          const isOpen = expanded.has(ack.name);
          return (
            <ThemedCard key={ack.name}>
              <ThemedCardHeader>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <ThemedCardTitle className="text-base font-mono">
                    {ack.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      v{ack.version}
                    </span>
                  </ThemedCardTitle>
                  <span className="text-sm text-muted-foreground">
                    {ack.license}
                  </span>
                </div>
              </ThemedCardHeader>
              {ack.licenseText && (
                <ThemedCardContent>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => toggle(ack.name)}
                  >
                    {isOpen ? "Hide license text" : "Show license text"}
                  </Button>
                  {isOpen && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground max-h-96 overflow-y-auto">
                      {ack.licenseText}
                    </pre>
                  )}
                </ThemedCardContent>
              )}
            </ThemedCard>
          );
        })}
      </div>
    </div>
  );
}
