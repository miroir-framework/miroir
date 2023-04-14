import { EntityAttribute } from 'miroir-core';

declare function getColumnDefinitions(attributes: EntityAttribute[]): {
    headerName: string;
    field: string;
}[];

export { getColumnDefinitions };
