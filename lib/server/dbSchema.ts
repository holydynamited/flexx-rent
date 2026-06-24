import { RowDataPacket } from 'mysql2';

import { databaseConnect } from '@/lib/db';

interface CountRow extends RowDataPacket {
  total: number;
}

const columnPresenceCache = new Map<string, boolean>();
const enumValueCache = new Map<string, boolean>();

export async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}`;
  if (columnPresenceCache.has(cacheKey)) {
    return columnPresenceCache.get(cacheKey) as boolean;
  }

  try {
    const [rows] = await databaseConnect.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
      `,
      [tableName, columnName]
    );

    const exists = Number(rows[0]?.total ?? 0) > 0;
    columnPresenceCache.set(cacheKey, exists);
    return exists;
  } catch (error) {
    console.error('Failed to inspect schema column presence:', error);
    columnPresenceCache.set(cacheKey, false);
    return false;
  }
}

interface ColumnTypeRow extends RowDataPacket {
  column_type: string;
}

export async function hasEnumValue(
  tableName: string,
  columnName: string,
  enumValue: string
): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}.${enumValue}`;
  if (enumValueCache.has(cacheKey)) {
    return enumValueCache.get(cacheKey) as boolean;
  }

  try {
    const [rows] = await databaseConnect.execute<ColumnTypeRow[]>(
      `
        SELECT COLUMN_TYPE AS column_type
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = ?
          AND column_name = ?
        LIMIT 1
      `,
      [tableName, columnName]
    );

    const columnType = rows[0]?.column_type || '';
    const exists = columnType.toUpperCase().includes(`'${enumValue.toUpperCase()}'`);
    enumValueCache.set(cacheKey, exists);
    return exists;
  } catch (error) {
    console.error('Failed to inspect enum value presence:', error);
    enumValueCache.set(cacheKey, false);
    return false;
  }
}
