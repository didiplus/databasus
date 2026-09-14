import { Button, Input } from 'antd';
import { useEffect, useState } from 'react';

import {
  type Database,
  DatabaseType,
  databaseApi,
  getDatabaseLogoFromType,
  initializeDatabaseTypeData,
  isPostgresType,
} from '../../../../entity/databases';
import { useTranslation } from '../../../../shared/i18n';

interface Props {
  database: Database;

  isShowName?: boolean;
  isShowEngine?: boolean;
  isShowCancelButton?: boolean;
  onCancel: () => void;

  saveButtonText?: string;
  isSaveToApi: boolean;
  onSaved: (db: Database) => void;
}

export const EditDatabaseBaseInfoComponent = ({
  database,
  isShowName,
  isShowEngine,
  isShowCancelButton,
  onCancel,
  saveButtonText,
  isSaveToApi,
  onSaved,
}: Props) => {
  const { t } = useTranslation();

  const databaseEngineOptions = [
    { type: DatabaseType.POSTGRES_LOGICAL, label: t('databases.typePostgresql') },
    { type: DatabaseType.MYSQL, label: t('databases.typeMysql') },
    { type: DatabaseType.MARIADB, label: t('databases.typeMariadb') },
    { type: DatabaseType.MONGODB, label: t('databases.typeMongodb') },
  ];

  const [editingDatabase, setEditingDatabase] = useState<Database>();
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateDatabase = (patch: Partial<Database>) => {
    setEditingDatabase((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsUnsaved(true);
  };

  const handleTypeChange = (newType: DatabaseType) => {
    if (!editingDatabase) return;

    setEditingDatabase(initializeDatabaseTypeData({ ...editingDatabase, type: newType }));
    setIsUnsaved(true);
  };

  const saveDatabase = async () => {
    if (!editingDatabase) return;
    if (isSaveToApi) {
      setIsSaving(true);

      try {
        editingDatabase.name = editingDatabase.name?.trim();
        await databaseApi.updateDatabase(editingDatabase);
        setIsUnsaved(false);
      } catch (e) {
        alert((e as Error).message);
      }

      setIsSaving(false);
    }
    onSaved(editingDatabase);
  };

  useEffect(() => {
    setIsSaving(false);
    setIsUnsaved(false);
    setEditingDatabase({ ...database });
  }, [database]);

  if (!editingDatabase) return null;

  const isAllFieldsFilled = !!editingDatabase.name?.trim();

  return (
    <div>
      {isShowName && (
        <div className="mb-3 flex items-center">
          <div className="mr-3">{t('common.name')}</div>
          <Input
            value={editingDatabase.name || ''}
            onChange={(e) => updateDatabase({ name: e.target.value })}
            size="small"
            placeholder={t('databases.nameExamplePlaceholder')}
            className="grow"
          />
        </div>
      )}

      {isShowEngine && (
        <div className="grid grid-cols-2 gap-3">
          {databaseEngineOptions.map((option) => {
            const isSelected = isPostgresType(option.type)
              ? isPostgresType(editingDatabase.type)
              : editingDatabase.type === option.type;

            return (
              <div
                key={option.type}
                onClick={() => handleTypeChange(option.type)}
                className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border text-center text-xs transition hover:border-blue-400 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <img
                  src={getDatabaseLogoFromType(option.type)}
                  alt={option.label}
                  className="h-7 w-7"
                />

                <span className="px-1 leading-tight">{option.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex">
        {isShowCancelButton && (
          <Button danger ghost className="mr-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}

        <Button
          type="primary"
          className={isShowCancelButton ? 'ml-1' : 'ml-auto'}
          onClick={saveDatabase}
          loading={isSaving}
          disabled={(isSaveToApi && !isUnsaved) || !isAllFieldsFilled}
        >
          {saveButtonText || t('common.save')}
        </Button>
      </div>
    </div>
  );
};
