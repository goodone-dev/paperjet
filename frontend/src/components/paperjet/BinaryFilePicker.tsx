import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { File, X } from 'lucide-react';
import { SelectFile } from '@/lib/api';

interface BinaryFilePickerProps {
    filePath: string | null;
    onChange: (path: string | null) => void;
}

export const BinaryFilePicker: React.FC<BinaryFilePickerProps> = ({ filePath, onChange }) => {
    const handleSelect = useCallback(async () => {
        const path = await SelectFile();
        if (path) onChange(path);
    }, [onChange]);

    return (
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-8">
            {filePath ? (
                <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1 font-mono" title={filePath}>
                        {filePath.split(/[\/\\]/).pop()}
                    </span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:block" title={filePath}>
                        {filePath}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => onChange(null)}
                        title="Remove file"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="text-center">
                    <File className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No file selected</p>
                    <Button variant="outline" size="sm" onClick={handleSelect}>
                        Select File
                    </Button>
                </div>
            )}
        </div>
    );
};