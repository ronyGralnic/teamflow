import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkle, Sparkles } from "lucide-react";
import { useChat } from '@ai-sdk/react';
import { eventIteratorToStream } from "@orpc/client";
import { client } from "@/lib/orpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface SummarizeThreadProps {
  messageId: string;
}

export function SummarizeThread({ messageId }: SummarizeThreadProps) {
  const { messages, status, error, sendMessage, setMessages, stop, clearError } = useChat({
    id: `thread-summary:${messageId}`,
    transport: {
      async sendMessages(options) {
        const iterator = await client.ai.thread.summary.generate(
          { messageId },
          { signal: options.abortSignal }
        );

        if (!iterator) {
          throw new Error("Failed to generate summary stream");
        }

        return eventIteratorToStream(iterator);
      },
      reconnectToStream() {
        throw new Error('Unsupported');
      },
    },
  });

  const lastAssistant = messages.findLast((m) => m.role === 'assistant');
  const summaryText = lastAssistant?.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('\n\n') ?? '';

  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      const hasAssistantMessage = messages.some((m) => m.role === 'assistant');
      if (status !== 'ready' || hasAssistantMessage) return;

      sendMessage({ text: "Summarize thread" });
    } else {
      stop();
      clearError();
      setMessages([]);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="relative overflow-hidden rounded-full bg-linear-to-l from-violet-600 to-fuchsia-600 text-white shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-xs font-medium">Summarize</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[25rem] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 py-1.5 px-4 gap-1. 5">
              <Sparkles className="size-3.5 text-white" />
              <span className="text-sm font-medium">AI Summary (Preview)</span>
            </span>
          </div>

          {status === 'streaming' && (
            <Button
              onClick={() => stop()}
              type="button"
              size="sm"
              variant="outline"
            >
              Stop
            </Button>
          )}
        </div>

        <div className="px-4 py-3 max-h-80 overflow-auto">
          {error ? (
            <div>
              <p className="text-red-500">{error.message}</p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  clearError();
                  setMessages([]);
                  sendMessage({ text: 'Summarize Thread' });
                }}
              >
                Try Again
              </Button>
            </div>
          ) : summaryText ? (
            <p>{summaryText}</p>
          ) : status === 'submitted' || status === 'streaming' ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Click summarize to generate
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
