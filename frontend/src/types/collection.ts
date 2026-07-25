export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = typeof HTTP_METHODS[number];

export const methodColorMap: Record<string, string> = {
    GET: 'text-method-get',
    POST: 'text-method-post',
    PUT: 'text-method-put',
    PATCH: 'text-method-patch',
    DELETE: 'text-method-delete',
    HEAD: 'text-info',
    OPTIONS: 'text-muted-foreground',
};

export interface KeyValueRow {
    id: string;
    key: string;
    value: string;
    description?: string;
    enabled: boolean;
}

export interface NoneAuth { type: 'none' }
export interface BearerAuth { type: 'bearer'; token?: string; bearer?: { token: string } }
export interface BasicAuth { type: 'basic'; username?: string; password?: string; basic?: { username: string; password: string } }
export interface ApiKeyAuth { type: 'apikey'; key?: string; apiValue?: string; value?: string; api_key?: { key: string; value: string } }
export interface OAuth2Auth { type: 'oauth2' }
export type AuthConfig = NoneAuth | BearerAuth | BasicAuth | ApiKeyAuth | OAuth2Auth;

export interface NoneBody { type: 'none' }
export interface RawBody { type: 'raw'; raw?: { type: string; value: string } }
export interface FormDataBody { type: 'form-data'; form_data?: BackendKeyValue[] }
export interface UrlEncodedBody { type: 'x-www-form-urlencoded'; url_encoded?: BackendKeyValue[] }
export interface BinaryBody { type: 'binary' }
export interface GraphqlBody { type: 'graphql' }
export type BodyConfig = NoneBody | RawBody | FormDataBody | UrlEncodedBody | BinaryBody | GraphqlBody;

export interface BackendKeyValue {
    key: string;
    value: string;
    description?: string;
    enabled?: boolean;
}

export interface BackendRequest {
    id: string;
    name: string;
    method: HttpMethod | string;
    url: string;
    params?: BackendKeyValue[];
    path_variables?: BackendKeyValue[];
    auth?: AuthConfig;
    headers?: BackendKeyValue[];
    body?: BodyConfig;
}

export interface RequestSummary {
    id: string;
    name: string;
    method: HttpMethod | string;
    url?: string;
}

export interface Folder {
    id: string;
    name: string;
    expanded: boolean;
    loaded?: boolean;
    folders: Folder[];
    requests: RequestSummary[];
}

export interface Collection {
    id: string;
    name: string;
    favorite: boolean;
    expanded: boolean;
    loaded: boolean;
    folders: Folder[];
    requests: RequestSummary[];
    is_favorite?: boolean;
}
