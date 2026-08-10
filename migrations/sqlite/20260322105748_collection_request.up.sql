CREATE TABLE IF NOT EXISTS collection_requests (
    id UUID PRIMARY KEY,
    collection_id UUID NOT NULL,
    folder_id UUID NULL,
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL,
    method VARCHAR NOT NULL,
    url TEXT NOT NULL,
    query_params BLOB NULL,
    path_variables BLOB NULL,
    auth BLOB NULL,
    headers BLOB NULL,
    body BLOB NULL,
    idx INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES collection_folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_collection_requests_collection_id ON collection_requests(collection_id);
CREATE INDEX idx_collection_requests_folder_id ON collection_requests(folder_id);
