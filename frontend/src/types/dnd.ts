export interface DragSource {
    kind: 'request' | 'folder';
    colId: string;
    folderId?: string;
    reqId?: string;
}

export interface DropDest {
    colId: string;
    folderId?: string;
    beforeReqId?: string;
    beforeFolderId?: string;
}
