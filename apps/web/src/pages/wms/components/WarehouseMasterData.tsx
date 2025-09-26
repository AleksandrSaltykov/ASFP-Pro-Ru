import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type { Warehouse, WarehouseCell, WarehouseZone } from '@shared/api';
import {
  useCellsQuery,
  useCreateCellMutation,
  useCreateWarehouseMutation,
  useCreateZoneMutation,
  useDeleteCellMutation,
  useDeleteWarehouseMutation,
  useDeleteZoneMutation,
  useUpdateCellMutation,
  useUpdateWarehouseMutation,
  useUpdateZoneMutation,
  useWarehousesQuery,
  useZonesQuery
} from '@shared/api';
import { layout, palette, typography } from '@shared/ui/theme';

import { CellForm } from './CellForm';
import { WarehouseForm } from './WarehouseForm';
import { ZoneForm } from './ZoneForm';

type WarehouseFormState =
  | { mode: 'create' }
  | { mode: 'edit'; warehouse: Warehouse };

type ZoneFormState =
  | { mode: 'create'; warehouseId: string }
  | { mode: 'edit'; warehouseId: string; zone: WarehouseZone };

type CellFormState =
  | { mode: 'create'; warehouseId: string; zoneId: string }
  | { mode: 'edit'; warehouseId: string; zoneId: string; cell: WarehouseCell };

export const WarehouseMasterData = () => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormState | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneFormState | null>(null);
  const [cellForm, setCellForm] = useState<CellFormState | null>(null);

  const warehousesQuery = useWarehousesQuery();
  const warehouses = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  useEffect(() => {
    if (warehouses.length === 0) {
      setSelectedWarehouseId(null);
      return;
    }

    if (!selectedWarehouseId || !warehouses.some((item) => item.id === selectedWarehouseId)) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((item) => item.id === selectedWarehouseId) ?? null,
    [warehouses, selectedWarehouseId]
  );

  const zonesQuery = useZonesQuery(selectedWarehouseId ?? undefined);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);

  useEffect(() => {
    if (!selectedWarehouseId || zones.length === 0) {
      setSelectedZoneId(null);
      return;
    }

    if (!selectedZoneId || !zones.some((zone) => zone.id === selectedZoneId)) {
      setSelectedZoneId(zones[0].id);
    }
  }, [selectedWarehouseId, selectedZoneId, zones]);

  const selectedZone = useMemo(
    () => zones.find((item) => item.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  const cellsQuery = useCellsQuery(selectedWarehouseId ?? undefined, selectedZoneId ?? undefined);
  const cells = cellsQuery.data ?? [];

  const createWarehouse = useCreateWarehouseMutation({
    onSuccess: (data) => {
      setWarehouseForm(null);
      setSelectedWarehouseId(data.id);
    }
  });
  const updateWarehouse = useUpdateWarehouseMutation({
    onSuccess: (data, variables) => {
      setWarehouseForm(null);
      setSelectedWarehouseId(variables.warehouseId);
    }
  });
  const deleteWarehouse = useDeleteWarehouseMutation({
    onSuccess: (_, warehouseId) => {
      if (selectedWarehouseId === warehouseId) {
        setSelectedWarehouseId(null);
      }
    }
  });

  const createZone = useCreateZoneMutation({
    onSuccess: (data) => {
      setZoneForm(null);
      setSelectedZoneId(data.id);
    }
  });
  const updateZone = useUpdateZoneMutation({
    onSuccess: (data) => {
      setZoneForm(null);
      setSelectedZoneId(data.id);
    }
  });
  const deleteZone = useDeleteZoneMutation({
    onSuccess: (_, variables) => {
      if (selectedZoneId === variables.zoneId) {
        setSelectedZoneId(null);
      }
    }
  });

  const createCell = useCreateCellMutation({
    onSuccess: () => {
      setCellForm(null);
    }
  });
  const updateCell = useUpdateCellMutation({
    onSuccess: () => {
      setCellForm(null);
    }
  });
  const deleteCell = useDeleteCellMutation();

  const handleWarehouseSubmit = (payload: Parameters<typeof createWarehouse.mutate>[0]) => {
    if (warehouseForm?.mode === 'edit' && warehouseForm.warehouse) {
      updateWarehouse.mutate({ warehouseId: warehouseForm.warehouse.id, payload });
    } else {
      createWarehouse.mutate(payload);
    }
  };

  const handleZoneSubmit = (payload: Parameters<typeof createZone.mutate>[0]['payload']) => {
    if (!selectedWarehouseId) {
      return;
    }

    if (zoneForm?.mode === 'edit') {
      updateZone.mutate({ warehouseId: zoneForm.warehouseId, zoneId: zoneForm.zone.id, payload });
    } else {
      createZone.mutate({ warehouseId: selectedWarehouseId, payload });
    }
  };

  const handleCellSubmit = (payload: Parameters<typeof createCell.mutate>[0]['payload']) => {
    if (!selectedWarehouseId || !selectedZoneId) {
      return;
    }

    if (cellForm?.mode === 'edit') {
      updateCell.mutate({
        warehouseId: cellForm.warehouseId,
        zoneId: cellForm.zoneId,
        cellId: cellForm.cell.id,
        payload
      });
    } else {
      createCell.mutate({ warehouseId: selectedWarehouseId, zoneId: selectedZoneId, payload });
    }
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    if (!window.confirm(`Удалить склад «${warehouse.name}» и все его зависимые данные?`)) {
      return;
    }
    deleteWarehouse.mutate(warehouse.id);
  };

  const handleDeleteZone = (zone: WarehouseZone) => {
    if (!selectedWarehouseId) {
      return;
    }
    if (!window.confirm(`Удалить зону «${zone.name}»?`)) {
      return;
    }
    deleteZone.mutate({ warehouseId: selectedWarehouseId, zoneId: zone.id });
  };

  const handleDeleteCell = (cell: WarehouseCell) => {
    if (!selectedWarehouseId || !selectedZoneId) {
      return;
    }
    if (!window.confirm(`Удалить ячейку ${cell.code}?`)) {
      return;
    }
    deleteCell.mutate({ warehouseId: selectedWarehouseId, zoneId: selectedZoneId, cellId: cell.id });
  };

  return (
    <>
      <div style={containerStyle}>
        <aside style={sidebarStyle}>
          <header style={sidebarHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Склады</h2>
              <p style={sectionSubtitleStyle}>Управляйте площадками и их паспортами</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => setWarehouseForm({ mode: 'create' })}>
              Добавить
            </button>
          </header>

          {warehousesQuery.isLoading ? (
            <div style={placeholderStyle}>Загружаем список складов…</div>
          ) : warehousesQuery.error ? (
            <div style={errorStyle}>Не удалось загрузить склады: {warehousesQuery.error.message}</div>
          ) : (
            <div style={listStyle}>
              {warehouses.map((warehouse) => {
                const isActive = warehouse.id === selectedWarehouseId;
                return (
                  <div
                    key={warehouse.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedWarehouseId(warehouse.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectedWarehouseId(warehouse.id);
                      }
                    }}
                    style={{
                      ...listItemStyle,
                      border: isActive ? `1px solid ${palette.accentMuted}` : listItemStyle.border,
                      background: isActive ? palette.layerStrong : listItemStyle.background,
                      boxShadow: isActive ? palette.shadowElevated : 'none'
                    }}
                  >
                  <div style={itemHeaderStyle}>
                    <div>
                      <div style={itemNameStyle}>{warehouse.name}</div>
                      <div style={itemCodeStyle}>{warehouse.code}</div>
                    </div>
                    <div style={itemActionsStyle}>
                      <button
                        type="button"
                        style={linkButtonStyle}
                        onClick={(event) => {
                          event.stopPropagation();
                          setWarehouseForm({ mode: 'edit', warehouse });
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        style={dangerLinkButtonStyle}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteWarehouse(warehouse);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <div style={itemMetaStyle}>
                    <span>Статус: {warehouse.status}</span>
                    {warehouse.address?.city ? <span>• {warehouse.address.city}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </aside>

      <section style={contentStyle}>
        {selectedWarehouse ? (
          <>
            <article style={summaryCardStyle}>
              <div style={summaryHeaderStyle}>
                <div>
                  <h3 style={summaryTitleStyle}>{selectedWarehouse.name}</h3>
                  <div style={summaryCodeStyle}>{selectedWarehouse.code}</div>
                </div>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setWarehouseForm({ mode: 'edit', warehouse: selectedWarehouse })}
                >
                  Редактировать склад
                </button>
              </div>
              <div style={summaryGridStyle}>
                <div>
                  <span style={summaryLabelStyle}>Статус</span>
                  <span style={summaryValueStyle}>{selectedWarehouse.status}</span>
                </div>
                <div>
                  <span style={summaryLabelStyle}>Часовой пояс</span>
                  <span style={summaryValueStyle}>{selectedWarehouse.timezone}</span>
                </div>
                <div>
                  <span style={summaryLabelStyle}>Адрес</span>
                  <span style={summaryValueStyle}>
                    {[selectedWarehouse.address?.country, selectedWarehouse.address?.region, selectedWarehouse.address?.city, selectedWarehouse.address?.street, selectedWarehouse.address?.building]
                      .filter(Boolean)
                      .join(', ') || 'Не указано'}
                  </span>
                </div>
                <div>
                  <span style={summaryLabelStyle}>Контакт</span>
                  <span style={summaryValueStyle}>
                    {[selectedWarehouse.contact?.manager, selectedWarehouse.contact?.phone, selectedWarehouse.contact?.email]
                      .filter(Boolean)
                      .join(' • ') || 'Не задано'}
                  </span>
                </div>
              </div>
            </article>

            <article style={sectionCardStyle}>
              <header style={sectionHeaderStyle}>
                <div>
                  <h3 style={sectionTitleStyle}>Зоны склада</h3>
                  <p style={sectionSubtitleStyle}>Распределите площади по функциональным зонам и буферам</p>
                </div>
                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={() =>
                    setZoneForm({ mode: 'create', warehouseId: selectedWarehouse.id })
                  }
                >
                  Добавить зону
                </button>
              </header>

              {zonesQuery.isLoading ? (
                <div style={placeholderStyle}>Загружаем зоны…</div>
              ) : zonesQuery.error ? (
                <div style={errorStyle}>Не удалось загрузить зоны: {zonesQuery.error.message}</div>
              ) : zones.length === 0 ? (
                <div style={placeholderStyle}>Зоны ещё не созданы. Добавьте первую зону для склада.</div>
              ) : (
                <div style={zoneGridStyle}>
                  {zones.map((zone) => {
                    const isActive = zone.id === selectedZoneId;
                    return (
                      <div
                        key={zone.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedZoneId(zone.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            setSelectedZoneId(zone.id);
                          }
                        }}
                        style={{
                          ...zoneCardStyle,
                          border: isActive ? `1px solid ${palette.accentMuted}` : zoneCardStyle.border,
                          boxShadow: isActive ? palette.shadowElevated : 'none'
                        }}
                      >
                        <div style={zoneHeaderStyle}>
                          <div>
                            <div style={zoneTitleStyle}>{zone.name}</div>
                            <div style={zoneCodeStyle}>{zone.code}</div>
                          </div>
                          <div style={zoneActionsStyle}>
                            <button
                              type="button"
                              style={linkButtonStyle}
                              onClick={(event) => {
                                event.stopPropagation();
                                setZoneForm({ mode: 'edit', warehouseId: selectedWarehouse.id, zone });
                              }}
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              style={dangerLinkButtonStyle}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteZone(zone);
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <div style={zoneMetaStyle}>
                          <span>Тип: {zone.zoneType}</span>
                          {zone.isBuffer ? <span>• Буфер</span> : null}
                          {zone.temperatureMin !== undefined || zone.temperatureMax !== undefined ? (
                            <span>
                              • Температура {zone.temperatureMin ?? '—'}…{zone.temperatureMax ?? '—'}°C
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article style={sectionCardStyle}>
              <header style={sectionHeaderStyle}>
                <div>
                  <h3 style={sectionTitleStyle}>Ячейки зоны</h3>
                  <p style={sectionSubtitleStyle}>
                    Адресное хранение, габариты и ограничения по выбранной зоне
                  </p>
                </div>
                <button
                  type="button"
                  style={primaryButtonStyle}
                  disabled={!selectedZone}
                  onClick={() =>
                    selectedZone &&
                    setCellForm({ mode: 'create', warehouseId: selectedWarehouse.id, zoneId: selectedZone.id })
                  }
                >
                  Добавить ячейку
                </button>
              </header>

              {!selectedZone ? (
                <div style={placeholderStyle}>Выберите зону, чтобы увидеть её ячейки</div>
              ) : cellsQuery.isLoading ? (
                <div style={placeholderStyle}>Загружаем адреса…</div>
              ) : cellsQuery.error ? (
                <div style={errorStyle}>Не удалось загрузить ячейки: {cellsQuery.error.message}</div>
              ) : cells.length === 0 ? (
                <div style={placeholderStyle}>В выбранной зоне пока нет ячеек.</div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderCellStyle}>Код</th>
                      <th style={tableHeaderCellStyle}>Тип</th>
                      <th style={tableHeaderCellStyle}>Габариты</th>
                      <th style={tableHeaderCellStyle}>Ограничения</th>
                      <th style={tableHeaderCellStyle}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cells.map((cell) => (
                      <tr key={cell.id} style={tableRowStyle}>
                        <td style={tableCellStyle}>
                          <div style={cellCodeStyle}>{cell.code}</div>
                          {cell.label ? <div style={cellLabelStyle}>{cell.label}</div> : null}
                          <div style={cellMetaStyle}>
                            {[cell.address?.section, cell.address?.aisle, cell.address?.rack, cell.address?.level, cell.address?.position]
                              .filter(Boolean)
                              .join('-')}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div>{cell.cellType}</div>
                          <div style={cellMetaStyle}>{cell.status}</div>
                          {cell.isPickFace ? <div style={chipStyle}>Пикинг</div> : null}
                        </td>
                        <td style={tableCellStyle}>
                          <div style={cellMetaStyle}>
                            {cell.lengthMm ?? '—'} × {cell.widthMm ?? '—'} × {cell.heightMm ?? '—'} мм
                          </div>
                          <div style={cellMetaStyle}>Вес до {cell.maxWeightKg ?? '—'} кг</div>
                          <div style={cellMetaStyle}>Объём до {cell.maxVolumeL ?? '—'} л</div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={cellMetaStyle}>
                            {(cell.allowedHandling ?? []).join(', ') || '—'}
                          </div>
                          <div style={cellMetaStyle}>
                            {(cell.hazardClasses ?? []).join(', ') || '—'}
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={tableActionsStyle}>
                            <button
                              type="button"
                              style={linkButtonStyle}
                              onClick={() =>
                                setCellForm({
                                  mode: 'edit',
                                  warehouseId: selectedWarehouse.id,
                                  zoneId: selectedZone.id,
                                  cell
                                })
                              }
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              style={dangerLinkButtonStyle}
                              onClick={() => handleDeleteCell(cell)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>
          </>
        ) : (
          <div style={placeholderStyle}>Выберите склад или создайте новый, чтобы продолжить.</div>
        )}
      </section>
    </div>
      {warehouseForm ? (
        <Modal onClose={() => setWarehouseForm(null)}>
          <WarehouseForm
            mode={warehouseForm.mode}
            initial={warehouseForm.mode === 'edit' ? warehouseForm.warehouse : undefined}
            submitting={createWarehouse.isPending || updateWarehouse.isPending}
            onSubmit={handleWarehouseSubmit}
            onCancel={() => setWarehouseForm(null)}
          />
        </Modal>
      ) : null}
      {zoneForm ? (
        <Modal onClose={() => setZoneForm(null)}>
          <ZoneForm
            mode={zoneForm.mode}
            initial={zoneForm.mode === 'edit' ? zoneForm.zone : undefined}
            submitting={createZone.isPending || updateZone.isPending}
            onSubmit={handleZoneSubmit}
            onCancel={() => setZoneForm(null)}
          />
        </Modal>
      ) : null}
      {cellForm ? (
        <Modal onClose={() => setCellForm(null)}>
          <CellForm
            mode={cellForm.mode}
            initial={cellForm.mode === 'edit' ? cellForm.cell : undefined}
            submitting={createCell.isPending || updateCell.isPending}
            onSubmit={handleCellSubmit}
            onCancel={() => setCellForm(null)}
          />
        </Modal>
      ) : null}
    </>
  );
};

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

const Modal = ({ children, onClose }: ModalProps) => (
  <div style={modalOverlayStyle} onClick={onClose} role="dialog" aria-modal="true">
    <div style={modalContentStyle} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  </div>
);

const containerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: 18
};

const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const sidebarHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const listItemStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  transition: 'all 0.2s ease'
};

const itemHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const itemNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: palette.textPrimary
};

const itemCodeStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft
};

const itemActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8
};

const itemMetaStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const contentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18
};

const summaryCardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: 18,
  boxShadow: palette.shadowElevated,
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const summaryHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const summaryTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: '-0.01em'
};

const summaryCodeStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: palette.textSoft
};

const summaryValueStyle: CSSProperties = {
  fontSize: 13,
  color: palette.textPrimary
};

const sectionCardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  boxShadow: palette.shadowElevated
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: palette.textPrimary
};

const sectionSubtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: palette.textSoft
};

const zoneGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
};

const zoneCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  transition: 'all 0.2s ease'
};

const zoneHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8
};

const zoneTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: palette.textPrimary
};

const zoneCodeStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft
};

const zoneActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8
};

const zoneMetaStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontFamily: typography.accentFamily,
  fontSize: 13
};

const tableHeaderCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  background: palette.layerStrong,
  color: palette.textSoft,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const tableRowStyle: CSSProperties = {
  borderBottom: `1px solid ${palette.glassBorder}`,
  background: palette.layer
};

const tableCellStyle: CSSProperties = {
  padding: '12px',
  verticalAlign: 'top',
  color: palette.textPrimary
};

const tableActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap'
};

const cellCodeStyle: CSSProperties = {
  fontWeight: 600,
  color: palette.textPrimary
};

const cellLabelStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft
};

const cellMetaStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSoft
};

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 999,
  background: palette.accentSoft,
  color: palette.textPrimary,
  fontSize: 11
};

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(6, 12, 30, 0.65)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: `${layout.headerHeight + 46}px 32px 32px`,
  width: '100%',
  zIndex: 1000
};

const modalContentStyle: CSSProperties = {
  width: 'min(960px, 100vw - 64px)',
  maxHeight: `calc(100vh - ${layout.headerHeight + 56}px)`,
  overflowY: 'auto',
  borderRadius: 20
};

const primaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: palette.accentSoft,
  color: palette.textPrimary,
  fontWeight: 600,
  fontFamily: typography.accentFamily,
  cursor: 'pointer'
};

const secondaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: 'transparent',
  color: palette.textSoft,
  fontFamily: typography.accentFamily,
  cursor: 'pointer'
};

const linkButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: palette.textPrimary,
  fontSize: 12,
  cursor: 'pointer',
  textDecoration: 'underline'
};

const dangerLinkButtonStyle: CSSProperties = {
  ...linkButtonStyle,
  color: '#ff8a8a'
};

const placeholderStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: `1px dashed ${palette.glassBorder}`,
  background: 'rgba(255, 255, 255, 0.02)',
  color: palette.textSoft,
  fontSize: 13
};

const errorStyle: CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: 'rgba(220, 86, 86, 0.12)',
  color: '#ff9999'
};
