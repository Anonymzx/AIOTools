"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { UploadCloud, X, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/store";

interface SelectedFile {
  file: File;
  preview: string | null;
}

interface FileDropzoneProps {
  accept?: Accept | string[];
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  onFiles: (files: File[]) => void;
  preview?: boolean;
  helperText?: string;
}

function toAccept(accept?: Accept | string[]): Accept | undefined {
  try {
    if (!accept) return undefined;
    if (Array.isArray(accept)) {
      const out: Accept = {};
      const existing: string[] = [];
      for (let i = 0; i < accept.length; i++) {
        existing.push(accept[i]);
      }
      out["application/octet-stream"] = existing;
      return out;
    }
    return accept;
  } catch {
    return undefined;
  }
}

function formatSize(bytes: number): string {
  try {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return "";
  }
}

function isImage(file: File): boolean {
  try {
    return file.type.startsWith("image/");
  } catch {
    return false;
  }
}

export default function FileDropzone({
  accept,
  multiple = false,
  maxSizeMB = 25,
  maxFiles = 10,
  onFiles,
  preview = true,
  helperText,
}: FileDropzoneProps) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<SelectedFile[]>([]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        setItems((prev) => {
          for (const it of prev) {
            try {
              if (it.preview) URL.revokeObjectURL(it.preview);
            } catch {
              // ignore
            }
          }
          return prev;
        });
      } catch {
        // ignore
      }
    };
  }, []);

  const emit = useCallback(
    (next: SelectedFile[]) => {
      try {
        onFiles(next.map((n) => n.file));
      } catch {
        toast.error(t.common.error);
      }
    },
    [onFiles, t.common.error],
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      try {
        for (const rej of rejections) {
          try {
            const tooLarge = rej.errors.some((e) => e.code === "file-too-large");
            const invalidType = rej.errors.some((e) => e.code === "file-invalid-type");
            const tooMany = rej.errors.some((e) => e.code === "too-many-files");
            if (tooLarge) toast.error(`${rej.file.name}: ${t.dropzone.tooLarge}`);
            else if (invalidType) toast.error(`${rej.file.name}: ${t.dropzone.invalidType}`);
            else if (tooMany) toast.error(t.dropzone.maxFiles);
            else toast.error(`${rej.file.name}: ${t.common.error}`);
          } catch {
            // ignore per-file toast errors
          }
        }
        if (accepted.length === 0) return;

        setItems((prev) => {
          try {
            const incoming: File[] = accepted;
            const capped: File[] = multiple
              ? [...prev.map((p) => p.file), ...incoming].slice(0, maxFiles)
              : incoming.slice(0, 1);
            if (multiple && prev.length + accepted.length > maxFiles) {
              toast.error(t.dropzone.maxFiles);
            }
            // Revoke previews being replaced in single mode
            if (!multiple) {
              for (const p of prev) {
                try {
                  if (p.preview) URL.revokeObjectURL(p.preview);
                } catch {
                  // ignore
                }
              }
            }
            const next: SelectedFile[] = capped.map((f) => {
              let url: string | null = null;
              try {
                url = preview && isImage(f) ? URL.createObjectURL(f) : null;
              } catch {
                url = null;
              }
              return { file: f, preview: url };
            });
            queueMicrotask(() => emit(next));
            return next;
          } catch {
            toast.error(t.common.error);
            return prev;
          }
        });
      } catch {
        toast.error(t.common.error);
      }
    },
    [emit, maxFiles, multiple, preview, t],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: toAccept(accept),
    multiple,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles: multiple ? maxFiles : 1,
  });

  const removeAt = (index: number) => {
    try {
      setItems((prev) => {
        const target = prev[index];
        try {
          if (target?.preview) URL.revokeObjectURL(target.preview);
        } catch {
          // ignore
        }
        const next = prev.filter((_, i) => i !== index);
        queueMicrotask(() => emit(next));
        return next;
      });
    } catch {
      toast.error(t.common.error);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
        animate={isDragActive && !reduceMotion ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative rounded-xl"
      >
        {isDragActive && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-indigo-500/10 shadow-[inset_0_0_48px_rgba(99,102,241,0.4)] dark:bg-indigo-400/10"
          />
        )}
        <div
          {...getRootProps()}
          role="button"
          aria-label={t.dropzone.title}
          className={cn(
            "relative flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-white px-4 py-8 text-center transition-colors duration-150",
            "hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
            "dark:border-zinc-700 dark:bg-zinc-900",
            isDragActive && "border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950",
          )}
        >
        <input {...getInputProps()} />
        <motion.span
          animate={
            isDragActive && !reduceMotion
              ? { y: [0, -10, 0], rotate: [0, -8, 8, 0] }
              : { y: 0, rotate: 0 }
          }
          transition={
            isDragActive && !reduceMotion
              ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-xl",
            isDragActive
              ? "bg-indigo-600 text-white"
              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
          )}
        >
          <UploadCloud className="h-5 w-5" aria-hidden />
        </motion.span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.dropzone.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {helperText ?? t.dropzone.subtitle}
        </p>
        <span className="mt-1 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
          {t.dropzone.browse}
          </span>
        </div>
      </motion.div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label={`${items.length} ${t.dropzone.filesSelected}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((it, i) => (
              <motion.li
                layout
                key={`${it.file.name}-${it.file.size}-${i}`}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.9 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -100, scale: 0.9 }}
                transition={{
                  duration: 0.25,
                  delay: reduceMotion ? 0 : i * 0.05,
                  ease: "easeOut",
                }}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
              {it.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.preview}
                  alt={it.file.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <FileIcon className="h-5 w-5" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {it.file.name}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSize(it.file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`${t.dropzone.remove}: ${it.file.name}`}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export { FileDropzone };
export type { FileDropzoneProps };
