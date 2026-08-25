import React, { useEffect, useState } from 'react';
import { DocViewer } from 'anyview';
import 'anyview/styles';

interface BodyPreviewProps {
    body: number[];
    contentType?: string;
}

export const BodyPreview: React.FC<BodyPreviewProps> = ({ body, contentType }) => {
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!body || body.length === 0) {
            setFile(null);
            return;
        }

        const mimeType = contentType?.split(';')[0].trim() || 'text/plain';
        const uint8Array = new Uint8Array(body);
        const blob = new Blob([uint8Array], { type: mimeType });
        const newFile = new File([blob], 'response' + getExtension(mimeType), { type: mimeType });

        setFile(newFile);
    }, [body, contentType]);

    if (!body || body.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                No content to preview
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto">
            {file && (
                <DocViewer
                    source={{ kind: 'file', file }}
                    theme="light"
                    showToolbar={false}
                    showSidebar={false}
                />
            )}
        </div>
    );
};

function getExtension(mimeType: string): string {
    const map: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/json': '.json',
        'text/html': '.html',
        'text/xml': '.xml',
        'application/xml': '.xml',
        'text/plain': '.txt',
        'text/csv': '.csv',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
    };
    return map[mimeType] || '';
}
