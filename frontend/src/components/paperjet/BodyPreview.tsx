'use client';

import React, { useEffect, useState } from 'react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';

interface BodyPreviewProps {
    body: number[];
    contentType?: string;
    isMaximized?: boolean;
}

export const BodyPreview: React.FC<BodyPreviewProps> = ({ body, contentType, isMaximized }) => {
    const [docs, setDocs] = useState<{ uri: string; fileName: string; fileType: string }[]>([]);

    useEffect(() => {
        if (!body || body.length === 0) {
            setDocs([]);
            return;
        }

        const mimeType = contentType?.split(';')[0].trim() || 'text/plain';
        const uint8Array = new Uint8Array(body);
        const blob = new Blob([uint8Array], { type: mimeType });
        const uri = URL.createObjectURL(blob);

        setDocs([
            {
                uri,
                fileName: 'response' + getExtension(mimeType),
                fileType: mimeType,
            },
        ]);

        return () => {
            URL.revokeObjectURL(uri);
        };
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
            {docs.length > 0 && (
                <DocViewer
                    key={isMaximized ? 'max' : 'min'}
                    documents={docs}
                    pluginRenderers={DocViewerRenderers}
                    config={{
                        header: {
                            disableHeader: true,
                        },
                    }}
                    theme={{
                        primary: 'transparent',
                        secondary: 'hsl(var(--background))',
                        tertiary: 'hsl(var(--card))',
                        textPrimary: 'hsl(var(--foreground))',
                        textSecondary: 'hsl(var(--muted-foreground))',
                        disableThemeScrollbar: true,
                    }}
                    style={{ height: '100%', width: '100%', overflow: 'auto', backgroundColor: 'transparent' }}
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
