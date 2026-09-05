export namespace collection {
	
	export class AuthAPIKey {
	    key: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthAPIKey(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class AuthBasic {
	    username: string;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthBasic(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.username = source["username"];
	        this.password = source["password"];
	    }
	}
	export class AuthBearer {
	    token: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthBearer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.token = source["token"];
	    }
	}
	export class Auth {
	    type: string;
	    bearer?: AuthBearer;
	    basic?: AuthBasic;
	    api_key?: AuthAPIKey;
	
	    static createFrom(source: any = {}) {
	        return new Auth(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.bearer = this.convertValues(source["bearer"], AuthBearer);
	        this.basic = this.convertValues(source["basic"], AuthBasic);
	        this.api_key = this.convertValues(source["api_key"], AuthAPIKey);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	export class KeyValueFull {
	    key: string;
	    type: string;
	    value: string;
	    description: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new KeyValueFull(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.type = source["type"];
	        this.value = source["value"];
	        this.description = source["description"];
	        this.enabled = source["enabled"];
	    }
	}
	export class BodyRaw {
	    type: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new BodyRaw(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.value = source["value"];
	    }
	}
	export class Body {
	    type: string;
	    raw?: BodyRaw;
	    form_data?: KeyValueFull[];
	    url_encoded?: KeyValueFull[];
	    binary?: string;
	
	    static createFrom(source: any = {}) {
	        return new Body(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.raw = this.convertValues(source["raw"], BodyRaw);
	        this.form_data = this.convertValues(source["form_data"], KeyValueFull);
	        this.url_encoded = this.convertValues(source["url_encoded"], KeyValueFull);
	        this.binary = source["binary"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ExampleNode {
	    id: string;
	    name: string;
	    method: string;
	    status: number;
	
	    static createFrom(source: any = {}) {
	        return new ExampleNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.status = source["status"];
	    }
	}
	export class RequestNode {
	    id: string;
	    name: string;
	    method: string;
	    sort_order?: string;
	    examples: ExampleNode[];
	
	    static createFrom(source: any = {}) {
	        return new RequestNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.sort_order = source["sort_order"];
	        this.examples = this.convertValues(source["examples"], ExampleNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FolderNode {
	    id: string;
	    name: string;
	    sort_order?: string;
	    folders: FolderNode[];
	    requests: RequestNode[];
	
	    static createFrom(source: any = {}) {
	        return new FolderNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sort_order = source["sort_order"];
	        this.folders = this.convertValues(source["folders"], FolderNode);
	        this.requests = this.convertValues(source["requests"], RequestNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CollectionResponse {
	    id: number[];
	    name: string;
	    slug: string;
	    is_favorite: boolean;
	    sort_order: string;
	    folders: FolderNode[];
	    requests: RequestNode[];
	
	    static createFrom(source: any = {}) {
	        return new CollectionResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.is_favorite = source["is_favorite"];
	        this.sort_order = source["sort_order"];
	        this.folders = this.convertValues(source["folders"], FolderNode);
	        this.requests = this.convertValues(source["requests"], RequestNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CollectionTree {
	    type: string;
	    id: string;
	    name: string;
	    method?: string;
	    sort_order?: string;
	    items?: CollectionTree[];
	
	    static createFrom(source: any = {}) {
	        return new CollectionTree(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.id = source["id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.sort_order = source["sort_order"];
	        this.items = this.convertValues(source["items"], CollectionTree);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateCollectionRequest {
	    workspace_id: number[];
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	    }
	}
	export class KeyValue {
	    key: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new KeyValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class CreateExampleRequest {
	    collection_id: number[];
	    request_id: number[];
	    name: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	    response_body: string;
	    response_headers: KeyValue[];
	    response_cookies: KeyValue[];
	    status: number;
	    status_text: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateExampleRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collection_id = source["collection_id"];
	        this.request_id = source["request_id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	        this.response_body = source["response_body"];
	        this.response_headers = this.convertValues(source["response_headers"], KeyValue);
	        this.response_cookies = this.convertValues(source["response_cookies"], KeyValue);
	        this.status = source["status"];
	        this.status_text = source["status_text"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CreateFolderRequest {
	    collection_id: number[];
	    parent_id?: number[];
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateFolderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collection_id = source["collection_id"];
	        this.parent_id = source["parent_id"];
	        this.name = source["name"];
	    }
	}
	export class CreateRequestRequest {
	    collection_id: number[];
	    folder_id?: number[];
	    name: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	
	    static createFrom(source: any = {}) {
	        return new CreateRequestRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.collection_id = source["collection_id"];
	        this.folder_id = source["folder_id"];
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ExampleResponse {
	    id: number[];
	    collection_id: number[];
	    request_id: number[];
	    name: string;
	    slug: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	    response_body: string;
	    response_headers: KeyValue[];
	    response_cookies: KeyValue[];
	    status: number;
	    status_text: string;
	    idx: number;
	
	    static createFrom(source: any = {}) {
	        return new ExampleResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collection_id = source["collection_id"];
	        this.request_id = source["request_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	        this.response_body = source["response_body"];
	        this.response_headers = this.convertValues(source["response_headers"], KeyValue);
	        this.response_cookies = this.convertValues(source["response_cookies"], KeyValue);
	        this.status = source["status"];
	        this.status_text = source["status_text"];
	        this.idx = source["idx"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FolderResponse {
	    id: number[];
	    collection_id: number[];
	    parent_id?: number[];
	    name: string;
	    slug: string;
	    sort_order: string;
	    idx: number;
	
	    static createFrom(source: any = {}) {
	        return new FolderResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collection_id = source["collection_id"];
	        this.parent_id = source["parent_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.sort_order = source["sort_order"];
	        this.idx = source["idx"];
	    }
	}
	
	
	export class MoveCollectionRequest {
	    target_workspace_id: number[];
	
	    static createFrom(source: any = {}) {
	        return new MoveCollectionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.target_workspace_id = source["target_workspace_id"];
	    }
	}
	export class RenameExampleRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameExampleRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class RenameFolderRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameFolderRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class RenameRequestRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameRequestRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class ReorderItemsRequest {
	    parent_folder_id?: string;
	    items?: CollectionTree[];
	
	    static createFrom(source: any = {}) {
	        return new ReorderItemsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.parent_folder_id = source["parent_folder_id"];
	        this.items = this.convertValues(source["items"], CollectionTree);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RequestResponse {
	    id: number[];
	    collection_id: number[];
	    folder_id?: number[];
	    name: string;
	    slug: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	
	    static createFrom(source: any = {}) {
	        return new RequestResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.collection_id = source["collection_id"];
	        this.folder_id = source["folder_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateExampleRequest {
	    name: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	    response_body: string;
	    response_headers: KeyValue[];
	    response_cookies: KeyValue[];
	    status: number;
	    status_text: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateExampleRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	        this.response_body = source["response_body"];
	        this.response_headers = this.convertValues(source["response_headers"], KeyValue);
	        this.response_cookies = this.convertValues(source["response_cookies"], KeyValue);
	        this.status = source["status"];
	        this.status_text = source["status_text"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateRequestRequest {
	    name: string;
	    method: string;
	    url: string;
	    query_params: KeyValueFull[];
	    path_variables: KeyValueFull[];
	    auth: Auth;
	    headers: KeyValueFull[];
	    body: Body;
	
	    static createFrom(source: any = {}) {
	        return new UpdateRequestRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], KeyValueFull);
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.headers = this.convertValues(source["headers"], KeyValueFull);
	        this.body = this.convertValues(source["body"], Body);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace environment {
	
	export class EnvironmentVariable {
	    id: string;
	    key: string;
	    value: string;
	    description: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EnvironmentVariable(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.description = source["description"];
	        this.enabled = source["enabled"];
	    }
	}
	export class CreateEnvironmentRequest {
	    workspace_id: number[];
	    name: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new CreateEnvironmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class EnvironmentResponse {
	    id: number[];
	    workspace_id: number[];
	    name: string;
	    slug: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new EnvironmentResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.workspace_id = source["workspace_id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class UpdateEnvironmentRequest {
	    name: string;
	    variables: EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateEnvironmentRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace proxy {
	
	export class ProxyPayload {
	    name: string;
	    method: string;
	    url: string;
	    query_params: collection.KeyValueFull[];
	    path_variables: collection.KeyValueFull[];
	    auth: collection.Auth;
	    headers: collection.KeyValueFull[];
	    body: collection.Body;
	    env_variables: environment.EnvironmentVariable[];
	
	    static createFrom(source: any = {}) {
	        return new ProxyPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.query_params = this.convertValues(source["query_params"], collection.KeyValueFull);
	        this.path_variables = this.convertValues(source["path_variables"], collection.KeyValueFull);
	        this.auth = this.convertValues(source["auth"], collection.Auth);
	        this.headers = this.convertValues(source["headers"], collection.KeyValueFull);
	        this.body = this.convertValues(source["body"], collection.Body);
	        this.env_variables = this.convertValues(source["env_variables"], environment.EnvironmentVariable);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Timing {
	    dns_lookup: number;
	    tcp_conn_time: number;
	    tls_handshake: number;
	    conn_time: number;
	    conn_idle_time: number;
	    server_time: number;
	    response_time: number;
	    total_time: number;
	
	    static createFrom(source: any = {}) {
	        return new Timing(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.dns_lookup = source["dns_lookup"];
	        this.tcp_conn_time = source["tcp_conn_time"];
	        this.tls_handshake = source["tls_handshake"];
	        this.conn_time = source["conn_time"];
	        this.conn_idle_time = source["conn_idle_time"];
	        this.server_time = source["server_time"];
	        this.response_time = source["response_time"];
	        this.total_time = source["total_time"];
	    }
	}
	export class ProxyResponse {
	    status: number;
	    statusText: string;
	    headers: Record<string, string>;
	    cookies: Record<string, string>;
	    body: number[];
	    size: number;
	    timing: Timing;
	
	    static createFrom(source: any = {}) {
	        return new ProxyResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.statusText = source["statusText"];
	        this.headers = source["headers"];
	        this.cookies = source["cookies"];
	        this.body = source["body"];
	        this.size = source["size"];
	        this.timing = this.convertValues(source["timing"], Timing);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace workspace {
	
	export class CreateWorkspaceRequest {
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new CreateWorkspaceRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	    }
	}
	export class WorkspaceResponse {
	    id: number[];
	    name: string;
	    slug: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.slug = source["slug"];
	    }
	}

}

