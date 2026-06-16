import { Sequelize } from 'sequelize';

interface TableInfo {
  tableName: string;
  exists: boolean;
}

export const schemaCheck = async (sequelize: Sequelize): Promise<TableInfo[]> => {
  const queryInterface = sequelize.getQueryInterface();
  const tables = Object.values(sequelize.models).map((m) => m.tableName);
  const results: TableInfo[] = [];

  for (const tableName of tables) {
    try {
      const exists = await queryInterface.tableExists(tableName);
      results.push({ tableName, exists });
    } catch {
      results.push({ tableName, exists: false });
    }
  }

  return results;
};
