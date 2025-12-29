import { useEffect, useRef } from 'react';
import { LogEntry } from '@/types/deriv';
import { cn } from '@/lib/utils';
import { Terminal as TerminalIcon, ChevronDown } from 'lucide-react';

interface ActivityTerminalProps {
  logs: LogEntry[];
}

const LOG_COLORS: Record<LogEntry['type'], string> = {
  SYS: 'text-terminal-sys',
  SIG: 'text-terminal-sig',
  TRD: 'text-terminal-trd',
  VLT: 'text-terminal-vlt',
  ERR: 'text-terminal-err',
};

const LOG_BADGES: Record<LogEntry['type'], string> = {
  SYS: 'bg-foreground/10 text-foreground',
  SIG: 'bg-primary/20 text-primary',
  TRD: 'bg-success/20 text-success',
  VLT: 'bg-gold/20 text-gold',
  ERR: 'bg-destructive/20 text-destructive',
};

export function ActivityTerminal({ logs }: ActivityTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Activity Terminal</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {logs.length} entries
        </span>
      </div>

      {/* Log Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Awaiting system initialization...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div 
                key={log.id}
                className={cn(
                  "terminal-line flex items-start gap-2 rounded px-2 py-1.5 transition-colors",
                  "hover:bg-muted/30"
                )}
              >
                <span className="shrink-0 text-muted-foreground">
                  {formatTime(log.timestamp)}
                </span>
                <span className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  LOG_BADGES[log.type]
                )}>
                  {log.type}
                </span>
                <span className={cn("flex-1 break-all", LOG_COLORS[log.type])}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!shouldAutoScroll.current && (
        <button
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              shouldAutoScroll.current = true;
            }
          }}
          className="flex items-center justify-center gap-1 border-t border-border bg-muted/50 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />
          Jump to latest
        </button>
      )}
    </aside>
  );
}
