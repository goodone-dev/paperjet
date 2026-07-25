export interface EnvVariable {
    id: string;
    key: string;
    value: string;
    description?: string;
    enabled: boolean;
}

export interface Environment {
    id: string;
    name: string;
    active: boolean;
    variables: EnvVariable[];
}
