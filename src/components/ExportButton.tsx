import { useState } from 'react';
import { 
  FileText, 
  Sheet, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  ChevronDown, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useExport } from '@/hooks/useExport';
import type { ExportFormat, ExportOptions } from '@/types/export';

interface ExportButtonProps {
  options: Omit<ExportOptions, 'format'>;
  formats?: ExportFormat[];
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  options,
  formats = ['pdf', 'excel', 'csv'],
  label = "Exportar",
  size = 'default',
  variant = 'outline',
  disabled = false,
  className
}: ExportButtonProps) {
  const { exportWithFeedback, isExporting } = useExport();
  const [open, setOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    setOpen(false);
    exportWithFeedback({ ...options, format });
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':   return <FileText className="h-4 w-4 text-red-500" />;
      case 'excel': return <Sheet className="h-4 w-4 text-green-600" />;
      case 'csv':   return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      case 'word':  return <FileText className="h-4 w-4 text-blue-800" />;
      case 'print': return <Printer className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':   return "Exportar PDF";
      case 'excel': return "Exportar Excel (.xlsx)";
      case 'csv':   return "Exportar CSV";
      case 'word':  return "Exportar Word (.docx)";
      case 'print': return "Imprimir";
    }
  };

  const isDisabled = disabled || isExporting || (!options.data || options.data.length === 0);

  if (formats.length === 1) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={isDisabled}
        onClick={() => handleExport(formats[0])}
      >
        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {label}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isDisabled}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Escolha o formato:
        </p>
        <div className="h-px bg-border my-1" />
        
        {formats.filter(f => f !== 'print').map((format) => (
          <button
            key={format}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
            onClick={() => handleExport(format)}
            disabled={isExporting}
          >
            {getFormatIcon(format)}
            {getFormatLabel(format)}
          </button>
        ))}

        {formats.includes('print') && (
          <>
            <div className="h-px bg-border my-1" />
            <button
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
              onClick={() => handleExport('print')}
              disabled={isExporting}
            >
              {getFormatIcon('print')}
              {getFormatLabel('print')}
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
