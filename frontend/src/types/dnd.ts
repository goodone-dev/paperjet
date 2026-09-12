export interface DragSource {
    kind: 'request' | 'folder' | 'example';
    colId: string;
    folderId?: string;
    reqId?: string;
    exampleId?: string;
}

export interface DropDest {
    colId: string;
    folderId?: string;
    reqId?: string;
    beforeReqId?: string;
    beforeFolderId?: string;
    beforeExampleId?: string;
}
