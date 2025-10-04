package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"asfppro/modules/wms/internal/entity"
)

// ListCatalogNodes returns catalog entries for provided type ordered by sort order and name.
func (r *MasterDataRepository) ListCatalogNodes(ctx context.Context, catalogType entity.CatalogType) ([]entity.CatalogNode, error) {
	query := `
        SELECT id, catalog_type, parent_id, code, name, description, level, path,
               metadata, sort_order, is_active, created_by, updated_by, created_at, updated_at
        FROM wms.catalog_node
        WHERE catalog_type = $1
        ORDER BY sort_order, name`

	rows, err := r.pool.Query(ctx, query, string(catalogType))
	if err != nil {
		return nil, fmt.Errorf("list catalog nodes: %w", err)
	}
	defer rows.Close()

	nodes := make([]entity.CatalogNode, 0)
	for rows.Next() {
		node, err := scanCatalogNode(rows)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, node)
	}
	return nodes, rows.Err()
}

// GetCatalogNode returns catalog entry by id constrained by type.
func (r *MasterDataRepository) GetCatalogNode(ctx context.Context, catalogType entity.CatalogType, id uuid.UUID) (entity.CatalogNode, error) {
	query := `
        SELECT id, catalog_type, parent_id, code, name, description, level, path,
               metadata, sort_order, is_active, created_by, updated_by, created_at, updated_at
        FROM wms.catalog_node
        WHERE catalog_type = $1 AND id = $2`

	row := r.pool.QueryRow(ctx, query, string(catalogType), id)
	return scanCatalogNode(row)
}

// GetCatalogNodeByCode returns catalog entry of specific type by code.
func (r *MasterDataRepository) GetCatalogNodeByCode(ctx context.Context, catalogType entity.CatalogType, code string) (entity.CatalogNode, error) {
	query := `
        SELECT id, catalog_type, parent_id, code, name, description, level, path,
               metadata, sort_order, is_active, created_by, updated_by, created_at, updated_at
        FROM wms.catalog_node
        WHERE catalog_type = $1 AND code = $2`
	row := r.pool.QueryRow(ctx, query, string(catalogType), code)
	return scanCatalogNode(row)
}

// CreateCatalogNode adds catalog entry and calculates hierarchy metadata.
func (r *MasterDataRepository) CreateCatalogNode(ctx context.Context, node entity.CatalogNode) (entity.CatalogNode, error) {
	if node.ID == uuid.Nil {
		node.ID = uuid.New()
	}
	node.Code = strings.TrimSpace(node.Code)
	if node.Code == "" {
		return entity.CatalogNode{}, fmt.Errorf("code is required")
	}
	node.Name = strings.TrimSpace(node.Name)
	if node.Name == "" {
		return entity.CatalogNode{}, fmt.Errorf("name is required")
	}
	if node.Metadata == nil {
		node.Metadata = map[string]any{}
	}

	var (
		parentParam any
		parentLevel int16
		parentPath  string
	)
	if node.ParentID != nil && *node.ParentID != uuid.Nil {
		parent, err := r.GetCatalogNode(ctx, node.Type, *node.ParentID)
		if err != nil {
			return entity.CatalogNode{}, err
		}
		parentParam = parent.ID
		parentLevel = parent.Level
		parentPath = parent.Path
	}

	node.Level = parentLevel
	node.Path = node.Code
	if parentParam != nil {
		node.Level = parentLevel + 1
		node.Path = parentPath + "." + node.Code
	}
	if node.SortOrder == 0 {
		node.SortOrder = int(node.Level)*100 + 10
	}
	if !node.IsActive {
		node.IsActive = true
	}

	description := sql.NullString{String: strings.TrimSpace(node.Description), Valid: strings.TrimSpace(node.Description) != ""}
	createdBy := uuid.Nil
	if node.CreatedBy != nil {
		createdBy = *node.CreatedBy
	}
	updatedBy := uuid.Nil
	if node.UpdatedBy != nil {
		updatedBy = *node.UpdatedBy
	}

	row := r.pool.QueryRow(ctx, `
        INSERT INTO wms.catalog_node (
            id, catalog_type, parent_id, code, name, description, level, path,
            metadata, sort_order, is_active, created_by, updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13
        )
        RETURNING created_at, updated_at`,
		node.ID,
		string(node.Type),
		parentParam,
		node.Code,
		node.Name,
		description,
		node.Level,
		node.Path,
		mustJSON(node.Metadata),
		node.SortOrder,
		node.IsActive,
		nilUUID(createdBy),
		nilUUID(updatedBy),
	)

	if err := row.Scan(&node.CreatedAt, &node.UpdatedAt); err != nil {
		return entity.CatalogNode{}, fmt.Errorf("insert catalog node: %w", err)
	}

	if parentParam != nil {
		parentID := parentParam.(uuid.UUID)
		node.ParentID = &parentID
	}

	if node.CreatedBy == nil && createdBy != uuid.Nil {
		tmp := createdBy
		node.CreatedBy = &tmp
	}
	if node.UpdatedBy == nil && updatedBy != uuid.Nil {
		tmp := updatedBy
		node.UpdatedBy = &tmp
	}

	return node, nil
}

// UpdateCatalogNode updates mutable fields of catalog entry (parent/code changes are not yet supported).
func (r *MasterDataRepository) UpdateCatalogNode(ctx context.Context, node entity.CatalogNode) (entity.CatalogNode, error) {
	existing, err := r.GetCatalogNode(ctx, node.Type, node.ID)
	if err != nil {
		return entity.CatalogNode{}, err
	}

	if node.ParentID != nil {
		if existing.ParentID == nil || *existing.ParentID != *node.ParentID {
			return entity.CatalogNode{}, fmt.Errorf("changing parent is not supported yet")
		}
	} else if existing.ParentID != nil {
		return entity.CatalogNode{}, fmt.Errorf("detaching parent is not supported yet")
	}

	if strings.TrimSpace(node.Code) != "" && strings.TrimSpace(node.Code) != existing.Code {
		return entity.CatalogNode{}, fmt.Errorf("changing code is not supported yet")
	}

	node.Code = existing.Code
	node.Level = existing.Level
	node.Path = existing.Path
	node.SortOrder = valueOrDefaultInt(node.SortOrder, existing.SortOrder)
	if node.Name = strings.TrimSpace(node.Name); node.Name == "" {
		node.Name = existing.Name
	}
	node.Description = strings.TrimSpace(node.Description)
	if node.Description == "" {
		node.Description = existing.Description
	}
	if node.Metadata == nil {
		node.Metadata = existing.Metadata
	}
	if node.UpdatedBy == nil {
		node.UpdatedBy = existing.UpdatedBy
	}
	node.CreatedBy = existing.CreatedBy

	description := sql.NullString{String: node.Description, Valid: node.Description != ""}
	updatedBy := uuid.Nil
	if node.UpdatedBy != nil {
		updatedBy = *node.UpdatedBy
	}

	row := r.pool.QueryRow(ctx, `
        UPDATE wms.catalog_node
        SET name = $3,
            description = $4,
            metadata = $5,
            sort_order = $6,
            is_active = $7,
            updated_by = $8,
            updated_at = NOW()
        WHERE id = $1 AND catalog_type = $2
        RETURNING created_at, updated_at`,
		node.ID,
		string(node.Type),
		node.Name,
		description,
		mustJSON(node.Metadata),
		node.SortOrder,
		node.IsActive,
		nilUUID(updatedBy),
	)

	if err := row.Scan(&node.CreatedAt, &node.UpdatedAt); err != nil {
		return entity.CatalogNode{}, fmt.Errorf("update catalog node: %w", err)
	}

	node.ParentID = existing.ParentID
	node.CreatedBy = existing.CreatedBy
	node.Path = existing.Path
	node.Level = existing.Level

	return node, nil
}

// DeleteCatalogNode removes catalog entry.
func (r *MasterDataRepository) DeleteCatalogNode(ctx context.Context, catalogType entity.CatalogType, id uuid.UUID) error {
	if _, err := r.pool.Exec(ctx, `DELETE FROM wms.catalog_node WHERE catalog_type = $1 AND id = $2`, string(catalogType), id); err != nil {
		return fmt.Errorf("delete catalog node: %w", err)
	}
	return nil
}

// ListAttributeTemplates returns templates filtered by target type.
func (r *MasterDataRepository) ListAttributeTemplates(ctx context.Context, targetType string) ([]entity.AttributeTemplate, error) {
	query := `
        SELECT id, code, name, description, target_type, data_type, is_required,
               metadata, ui_schema, position, created_at, updated_at
        FROM wms.attribute_templates
        WHERE target_type = $1
        ORDER BY position, name`

	rows, err := r.pool.Query(ctx, query, targetType)
	if err != nil {
		return nil, fmt.Errorf("list attribute templates: %w", err)
	}
	defer rows.Close()

	templates := make([]entity.AttributeTemplate, 0)
	for rows.Next() {
		template, err := scanAttributeTemplate(rows)
		if err != nil {
			return nil, err
		}
		templates = append(templates, template)
	}
	return templates, rows.Err()
}

// ListItems returns enriched item master data.

func (r *MasterDataRepository) CreateAttributeTemplate(ctx context.Context, template entity.AttributeTemplate) (entity.AttributeTemplate, error) {
	if template.ID == uuid.Nil {
		template.ID = uuid.New()
	}
	description := sql.NullString{String: strings.TrimSpace(template.Description), Valid: strings.TrimSpace(template.Description) != ""}
	metadata := mustJSON(template.Metadata)
	uiSchema := mustJSON(template.UISchema)

	row := r.pool.QueryRow(ctx, `
        INSERT INTO wms.attribute_templates (
            id, code, name, description, target_type, data_type, is_required,
            metadata, ui_schema, position
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10
        )
        RETURNING created_at, updated_at`,
		template.ID,
		template.Code,
		template.Name,
		description,
		template.TargetType,
		template.DataType,
		template.IsRequired,
		metadata,
		uiSchema,
		template.Position,
	)
	if err := row.Scan(&template.CreatedAt, &template.UpdatedAt); err != nil {
		return entity.AttributeTemplate{}, fmt.Errorf("insert attribute template: %w", err)
	}
	return template, nil
}

func (r *MasterDataRepository) UpdateAttributeTemplate(ctx context.Context, template entity.AttributeTemplate) (entity.AttributeTemplate, error) {
	description := sql.NullString{String: strings.TrimSpace(template.Description), Valid: strings.TrimSpace(template.Description) != ""}
	metadata := mustJSON(template.Metadata)
	uiSchema := mustJSON(template.UISchema)

	row := r.pool.QueryRow(ctx, `
        UPDATE wms.attribute_templates
        SET name = $2,
            description = $3,
            data_type = $4,
            is_required = $5,
            metadata = $6,
            ui_schema = $7,
            position = $8,
            updated_at = NOW()
        WHERE id = $1
        RETURNING code, target_type, created_at, updated_at`,
		template.ID,
		template.Name,
		description,
		template.DataType,
		template.IsRequired,
		metadata,
		uiSchema,
		template.Position,
	)
	var code, targetType string
	if err := row.Scan(&code, &targetType, &template.CreatedAt, &template.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.AttributeTemplate{}, pgx.ErrNoRows
		}
		return entity.AttributeTemplate{}, fmt.Errorf("update attribute template: %w", err)
	}
	template.Code = code
	template.TargetType = targetType
	return template, nil
}

func (r *MasterDataRepository) DeleteAttributeTemplate(ctx context.Context, id uuid.UUID) error {
	cmdTag, err := r.pool.Exec(ctx, `DELETE FROM wms.attribute_templates WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete attribute template: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *MasterDataRepository) ListItems(ctx context.Context) ([]entity.Item, error) {
	return r.loadItems(ctx, "", nil)
}

// GetItem returns single item by id.
func (r *MasterDataRepository) GetItem(ctx context.Context, id uuid.UUID) (entity.Item, error) {
	items, err := r.loadItems(ctx, "id = $1", []any{id})
	if err != nil {
		return entity.Item{}, err
	}
	if len(items) == 0 {
		return entity.Item{}, pgx.ErrNoRows
	}
	return items[0], nil
}

// CreateItem persists item with warehouses and dynamic attributes.
func (r *MasterDataRepository) CreateItem(ctx context.Context, item entity.Item, attributes []entity.AttributeValueUpsert) (entity.Item, error) {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	if item.Metadata == nil {
		item.Metadata = map[string]any{}
	}

	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.Item{}, err
	}
	defer tx.Rollback(ctx)

	if err := r.upsertItem(ctx, tx, &item); err != nil {
		return entity.Item{}, err
	}

	if err := r.replaceItemWarehouses(ctx, tx, item.ID, item.Warehouses); err != nil {
		return entity.Item{}, err
	}

	if err := r.replaceAttributeValues(ctx, tx, "item", item.ID, attributes); err != nil {
		return entity.Item{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return entity.Item{}, err
	}

	return r.GetItem(ctx, item.ID)
}

// UpdateItem updates item and related collections.
func (r *MasterDataRepository) UpdateItem(ctx context.Context, item entity.Item, attributes []entity.AttributeValueUpsert) (entity.Item, error) {
	if item.ID == uuid.Nil {
		return entity.Item{}, fmt.Errorf("id is required")
	}
	if item.Metadata == nil {
		item.Metadata = map[string]any{}
	}

	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.Item{}, err
	}
	defer tx.Rollback(ctx)

	if err := r.updateItemRow(ctx, tx, &item); err != nil {
		return entity.Item{}, err
	}

	if err := r.replaceItemWarehouses(ctx, tx, item.ID, item.Warehouses); err != nil {
		return entity.Item{}, err
	}

	if err := r.replaceAttributeValues(ctx, tx, "item", item.ID, attributes); err != nil {
		return entity.Item{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return entity.Item{}, err
	}

	return r.GetItem(ctx, item.ID)
}

// DeleteItem removes item and related records.
func (r *MasterDataRepository) DeleteItem(ctx context.Context, id uuid.UUID) error {
	if _, err := r.pool.Exec(ctx, `DELETE FROM wms.item WHERE id = $1`, id); err != nil {
		return fmt.Errorf("delete item: %w", err)
	}
	return nil
}

// ListCatalogLinks returns relations for entity.
func (r *MasterDataRepository) ListCatalogLinks(ctx context.Context, leftType string, leftID uuid.UUID) ([]entity.CatalogLink, error) {
	query := `
        SELECT left_id, left_type, right_id, right_type, relation_code, metadata, created_at
        FROM wms.catalog_links
        WHERE left_type = $1 AND left_id = $2
        ORDER BY relation_code, right_type`

	rows, err := r.pool.Query(ctx, query, leftType, leftID)
	if err != nil {
		return nil, fmt.Errorf("list catalog links: %w", err)
	}
	defer rows.Close()

	links := make([]entity.CatalogLink, 0)
	for rows.Next() {
		var (
			link     entity.CatalogLink
			metadata []byte
		)
		if err := rows.Scan(&link.LeftID, &link.LeftType, &link.RightID, &link.RightType, &link.RelationCode, &metadata, &link.CreatedAt); err != nil {
			return nil, err
		}
		link.Metadata = mustMap(metadata)
		links = append(links, link)
	}
	return links, rows.Err()
}

// ReplaceCatalogLinks rewrites relations for left entity.
func (r *MasterDataRepository) ReplaceCatalogLinks(ctx context.Context, leftType string, leftID uuid.UUID, links []entity.CatalogLink) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM wms.catalog_links WHERE left_type = $1 AND left_id = $2`, leftType, leftID); err != nil {
		return fmt.Errorf("cleanup catalog links: %w", err)
	}

	for _, link := range links {
		if link.RelationCode == "" {
			return fmt.Errorf("relationCode is required")
		}
		metadata := mustJSON(link.Metadata)
		if _, err := tx.Exec(ctx, `
            INSERT INTO wms.catalog_links (left_id, left_type, right_id, right_type, relation_code, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)`,
			leftID,
			leftType,
			link.RightID,
			link.RightType,
			link.RelationCode,
			metadata,
		); err != nil {
			return fmt.Errorf("insert catalog link: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *MasterDataRepository) loadItems(ctx context.Context, where string, args []any) ([]entity.Item, error) {
	query := `
        SELECT id, sku, name, description, category_id, COALESCE(category_path, '') AS category_path, unit_id,
               barcode, weight_kg, volume_m3, metadata, created_by, updated_by,
               created_at, updated_at
        FROM wms.item`
	if where != "" {
		query += " WHERE " + where
	}
	query += " ORDER BY name"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("select items: %w", err)
	}
	defer rows.Close()

	items := make([]entity.Item, 0)
	unitIDs := make(map[uuid.UUID]struct{})
	categoryIDs := make(map[uuid.UUID]struct{})

	for rows.Next() {
		var (
			item         entity.Item
			description  sql.NullString
			categoryID   pgtype.UUID
			categoryPath pgtype.Text
			barcode      sql.NullString
			weight       sql.NullFloat64
			volume       sql.NullFloat64
			metadata     []byte
			createdBy    pgtype.UUID
			updatedBy    pgtype.UUID
		)

		if err := rows.Scan(
			&item.ID,
			&item.SKU,
			&item.Name,
			&description,
			&categoryID,
			&categoryPath,
			&item.UnitID,
			&barcode,
			&weight,
			&volume,
			&metadata,
			&createdBy,
			&updatedBy,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}

		if categoryPath.Valid {
			item.CategoryPath = categoryPath.String
		}
		if description.Valid {
			item.Description = description.String
		}
		if categoryID.Valid {
			id := uuid.UUID(categoryID.Bytes)
			item.CategoryID = &id
			categoryIDs[id] = struct{}{}
		}
		if barcode.Valid {
			item.Barcode = barcode.String
		}
		if weight.Valid {
			v := weight.Float64
			item.WeightKG = &v
		}
		if volume.Valid {
			v := volume.Float64
			item.VolumeM3 = &v
		}
		item.Metadata = mustMap(metadata)
		if createdBy.Valid {
			id := uuid.UUID(createdBy.Bytes)
			item.CreatedBy = &id
		}
		if updatedBy.Valid {
			id := uuid.UUID(updatedBy.Bytes)
			item.UpdatedBy = &id
		}
		item.Warehouses = make([]uuid.UUID, 0)
		item.Attributes = make(entity.ItemAttributes, 0)

		items = append(items, item)
		unitIDs[item.UnitID] = struct{}{}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return items, nil
	}

	if err := r.attachUnitsAndCategories(ctx, items, unitIDs, categoryIDs); err != nil {
		return nil, err
	}

	if err := r.attachItemWarehouses(ctx, items); err != nil {
		return nil, err
	}

	if err := r.attachItemAttributes(ctx, items); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *MasterDataRepository) attachUnitsAndCategories(ctx context.Context, items []entity.Item, unitIDs map[uuid.UUID]struct{}, categoryIDs map[uuid.UUID]struct{}) error {
	unitMap, err := r.fetchCatalogNodesByIDs(ctx, unitIDs)
	if err != nil {
		return err
	}
	categoryMap, err := r.fetchCatalogNodesByIDs(ctx, categoryIDs)
	if err != nil {
		return err
	}

	for idx := range items {
		if unit, ok := unitMap[items[idx].UnitID]; ok {
			items[idx].Unit = unit
		}
		if items[idx].CategoryID != nil {
			if category, ok := categoryMap[*items[idx].CategoryID]; ok {
				items[idx].Category = category
			}
		}
	}
	return nil
}

func (r *MasterDataRepository) fetchCatalogNodesByIDs(ctx context.Context, ids map[uuid.UUID]struct{}) (map[uuid.UUID]entity.CatalogNode, error) {
	if len(ids) == 0 {
		return map[uuid.UUID]entity.CatalogNode{}, nil
	}

	idList := make([]uuid.UUID, 0, len(ids))
	for id := range ids {
		idList = append(idList, id)
	}

	query := `
        SELECT id, catalog_type, parent_id, code, name, description, level, path,
               metadata, sort_order, is_active, created_by, updated_by, created_at, updated_at
        FROM wms.catalog_node
        WHERE id = ANY($1)`

	rows, err := r.pool.Query(ctx, query, idList)
	if err != nil {
		return nil, fmt.Errorf("load catalog nodes: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID]entity.CatalogNode, len(idList))
	for rows.Next() {
		node, err := scanCatalogNode(rows)
		if err != nil {
			return nil, err
		}
		result[node.ID] = node
	}
	return result, rows.Err()
}

func (r *MasterDataRepository) attachItemWarehouses(ctx context.Context, items []entity.Item) error {
	ids := make([]uuid.UUID, 0, len(items))
	index := make(map[uuid.UUID]int, len(items))
	for idx, item := range items {
		ids = append(ids, item.ID)
		index[item.ID] = idx
	}

	rows, err := r.pool.Query(ctx, `SELECT item_id, warehouse_id FROM wms.item_warehouse WHERE item_id = ANY($1)`, ids)
	if err != nil {
		return fmt.Errorf("load item warehouses: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var itemID, warehouseID uuid.UUID
		if err := rows.Scan(&itemID, &warehouseID); err != nil {
			return err
		}
		if idx, ok := index[itemID]; ok {
			items[idx].Warehouses = append(items[idx].Warehouses, warehouseID)
		}
	}
	return rows.Err()
}

func (r *MasterDataRepository) attachItemAttributes(ctx context.Context, items []entity.Item) error {
	ids := make([]uuid.UUID, 0, len(items))
	index := make(map[uuid.UUID]int, len(items))
	for idx, item := range items {
		ids = append(ids, item.ID)
		index[item.ID] = idx
	}

	grouped, err := r.fetchAttributeValues(ctx, "item", ids)
	if err != nil {
		return err
	}

	for id, values := range grouped {
		if idx, ok := index[id]; ok {
			items[idx].Attributes = values
		}
	}
	return nil
}

func (r *MasterDataRepository) fetchAttributeValues(ctx context.Context, ownerType string, ownerIDs []uuid.UUID) (map[uuid.UUID]entity.ItemAttributes, error) {
	if len(ownerIDs) == 0 {
		return map[uuid.UUID]entity.ItemAttributes{}, nil
	}

	query := `
        SELECT v.owner_id,
               t.id, t.code, t.name, t.description, t.target_type, t.data_type,
               t.is_required, t.metadata, t.ui_schema, t.position, t.created_at, t.updated_at,
               v.string_value, v.number_value, v.boolean_value, v.json_value, v.updated_at
        FROM wms.attribute_values v
        JOIN wms.attribute_templates t ON t.id = v.template_id
        WHERE v.owner_type = $1 AND v.owner_id = ANY($2)
        ORDER BY v.owner_id, t.position, t.name`

	rows, err := r.pool.Query(ctx, query, ownerType, ownerIDs)
	if err != nil {
		return nil, fmt.Errorf("load attribute values: %w", err)
	}
	defer rows.Close()

	grouped := make(map[uuid.UUID]entity.ItemAttributes)
	for rows.Next() {
		value, ownerID, err := scanAttributeValue(rows)
		if err != nil {
			return nil, err
		}
		grouped[ownerID] = append(grouped[ownerID], value)
	}
	return grouped, rows.Err()
}

func (r *MasterDataRepository) replaceItemWarehouses(ctx context.Context, tx pgx.Tx, itemID uuid.UUID, warehouses []uuid.UUID) error {
	if _, err := tx.Exec(ctx, `DELETE FROM wms.item_warehouse WHERE item_id = $1`, itemID); err != nil {
		return fmt.Errorf("cleanup item warehouses: %w", err)
	}
	for _, id := range warehouses {
		if _, err := tx.Exec(ctx, `
            INSERT INTO wms.item_warehouse (item_id, warehouse_id)
            VALUES ($1, $2)
            ON CONFLICT (item_id, warehouse_id) DO NOTHING`, itemID, id); err != nil {
			return fmt.Errorf("insert item warehouse: %w", err)
		}
	}
	return nil
}

func (r *MasterDataRepository) replaceAttributeValues(ctx context.Context, tx pgx.Tx, ownerType string, ownerID uuid.UUID, values []entity.AttributeValueUpsert) error {
	if _, err := tx.Exec(ctx, `DELETE FROM wms.attribute_values WHERE owner_type = $1 AND owner_id = $2`, ownerType, ownerID); err != nil {
		return fmt.Errorf("cleanup attribute values: %w", err)
	}

	for _, val := range values {
		var (
			stringValue  any
			numberValue  any
			booleanValue any
			jsonValue    any
		)
		if val.String != nil {
			stringValue = *val.String
		}
		if val.Number != nil {
			numberValue = *val.Number
		}
		if val.Boolean != nil {
			booleanValue = *val.Boolean
		}
		if val.JSON != nil {
			jsonValue = val.JSON
		}
		if _, err := tx.Exec(ctx, `
            INSERT INTO wms.attribute_values (
                owner_type, owner_id, template_id, string_value, number_value, boolean_value, json_value)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			ownerType,
			ownerID,
			val.TemplateID,
			stringValue,
			numberValue,
			booleanValue,
			jsonValue,
		); err != nil {
			return fmt.Errorf("insert attribute value: %w", err)
		}
	}
	return nil
}

func (r *MasterDataRepository) upsertItem(ctx context.Context, tx pgx.Tx, item *entity.Item) error {
	description := sql.NullString{String: strings.TrimSpace(item.Description), Valid: strings.TrimSpace(item.Description) != ""}
	barcode := sql.NullString{String: strings.TrimSpace(item.Barcode), Valid: strings.TrimSpace(item.Barcode) != ""}
	var weight sql.NullFloat64
	if item.WeightKG != nil {
		weight = sql.NullFloat64{Float64: *item.WeightKG, Valid: true}
	}
	var volume sql.NullFloat64
	if item.VolumeM3 != nil {
		volume = sql.NullFloat64{Float64: *item.VolumeM3, Valid: true}
	}

	var categoryID any
	var categoryPath any
	if item.CategoryID != nil && *item.CategoryID != uuid.Nil {
		categoryID = *item.CategoryID
		if item.CategoryPath == "" {
			if err := tx.QueryRow(ctx, `SELECT path FROM wms.catalog_node WHERE id = $1`, *item.CategoryID).Scan(&item.CategoryPath); err != nil {
				return fmt.Errorf("load category path: %w", err)
			}
		}
		categoryPath = item.CategoryPath
	}

	createdBy := uuid.Nil
	if item.CreatedBy != nil {
		createdBy = *item.CreatedBy
	}
	updatedBy := uuid.Nil
	if item.UpdatedBy != nil {
		updatedBy = *item.UpdatedBy
	}

	row := tx.QueryRow(ctx, `
        INSERT INTO wms.item (
            id, sku, name, description, category_id, category_path, unit_id,
            barcode, weight_kg, volume_m3, metadata, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING created_at, updated_at`,
		item.ID,
		item.SKU,
		strings.TrimSpace(item.Name),
		description,
		categoryID,
		categoryPath,
		item.UnitID,
		barcode,
		weight,
		volume,
		mustJSON(item.Metadata),
		nilUUID(createdBy),
		nilUUID(updatedBy),
	)

	if err := row.Scan(&item.CreatedAt, &item.UpdatedAt); err != nil {
		return fmt.Errorf("insert item: %w", err)
	}
	return nil
}

func (r *MasterDataRepository) updateItemRow(ctx context.Context, tx pgx.Tx, item *entity.Item) error {
	description := sql.NullString{String: strings.TrimSpace(item.Description), Valid: strings.TrimSpace(item.Description) != ""}
	barcode := sql.NullString{String: strings.TrimSpace(item.Barcode), Valid: strings.TrimSpace(item.Barcode) != ""}
	var weight sql.NullFloat64
	if item.WeightKG != nil {
		weight = sql.NullFloat64{Float64: *item.WeightKG, Valid: true}
	}
	var volume sql.NullFloat64
	if item.VolumeM3 != nil {
		volume = sql.NullFloat64{Float64: *item.VolumeM3, Valid: true}
	}

	var categoryID any
	var categoryPath any
	if item.CategoryID != nil && *item.CategoryID != uuid.Nil {
		categoryID = *item.CategoryID
		if item.CategoryPath == "" {
			if err := tx.QueryRow(ctx, `SELECT path FROM wms.catalog_node WHERE id = $1`, *item.CategoryID).Scan(&item.CategoryPath); err != nil {
				return fmt.Errorf("load category path: %w", err)
			}
		}
		categoryPath = item.CategoryPath
	}

	updatedBy := uuid.Nil
	if item.UpdatedBy != nil {
		updatedBy = *item.UpdatedBy
	}

	row := tx.QueryRow(ctx, `
        UPDATE wms.item
        SET sku = $2,
            name = $3,
            description = $4,
            category_id = $5,
            category_path = $6,
            unit_id = $7,
            barcode = $8,
            weight_kg = $9,
            volume_m3 = $10,
            metadata = $11,
            updated_by = $12,
            updated_at = NOW()
        WHERE id = $1
        RETURNING created_at, updated_at`,
		item.ID,
		item.SKU,
		strings.TrimSpace(item.Name),
		description,
		categoryID,
		categoryPath,
		item.UnitID,
		barcode,
		weight,
		volume,
		mustJSON(item.Metadata),
		nilUUID(updatedBy),
	)

	if err := row.Scan(&item.CreatedAt, &item.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgx.ErrNoRows
		}
		return fmt.Errorf("update item: %w", err)
	}
	return nil
}

func scanCatalogNode(row pgx.Row) (entity.CatalogNode, error) {
	var (
		node        entity.CatalogNode
		catalogType string
		parentID    pgtype.UUID
		description sql.NullString
		metadata    []byte
		createdBy   pgtype.UUID
		updatedBy   pgtype.UUID
	)

	if err := row.Scan(
		&node.ID,
		&catalogType,
		&parentID,
		&node.Code,
		&node.Name,
		&description,
		&node.Level,
		&node.Path,
		&metadata,
		&node.SortOrder,
		&node.IsActive,
		&createdBy,
		&updatedBy,
		&node.CreatedAt,
		&node.UpdatedAt,
	); err != nil {
		return entity.CatalogNode{}, err
	}

	node.Type = entity.CatalogType(catalogType)
	if parentID.Valid {
		id := uuid.UUID(parentID.Bytes)
		node.ParentID = &id
	}
	if description.Valid {
		node.Description = description.String
	}
	node.Metadata = mustMap(metadata)
	if createdBy.Valid {
		id := uuid.UUID(createdBy.Bytes)
		node.CreatedBy = &id
	}
	if updatedBy.Valid {
		id := uuid.UUID(updatedBy.Bytes)
		node.UpdatedBy = &id
	}
	return node, nil
}

func scanAttributeTemplate(row pgx.Row) (entity.AttributeTemplate, error) {
	var (
		template      entity.AttributeTemplate
		metadataBytes []byte
		uiSchemaBytes []byte
		description   sql.NullString
	)

	if err := row.Scan(
		&template.ID,
		&template.Code,
		&template.Name,
		&description,
		&template.TargetType,
		&template.DataType,
		&template.IsRequired,
		&metadataBytes,
		&uiSchemaBytes,
		&template.Position,
		&template.CreatedAt,
		&template.UpdatedAt,
	); err != nil {
		return entity.AttributeTemplate{}, err
	}

	if description.Valid {
		template.Description = description.String
	}
	template.Metadata = mustMap(metadataBytes)
	template.UISchema = mustMap(uiSchemaBytes)
	return template, nil
}

func scanAttributeValue(row pgx.Row) (entity.AttributeValue, uuid.UUID, error) {
	var (
		ownerID      uuid.UUID
		templateID   uuid.UUID
		template     entity.AttributeTemplate
		metadata     []byte
		uiSchema     []byte
		description  sql.NullString
		stringValue  sql.NullString
		numberValue  sql.NullFloat64
		booleanValue sql.NullBool
		jsonValue    []byte
		updatedAt    time.Time
	)

	if err := row.Scan(
		&ownerID,
		&templateID,
		&template.Code,
		&template.Name,
		&description,
		&template.TargetType,
		&template.DataType,
		&template.IsRequired,
		&metadata,
		&uiSchema,
		&template.Position,
		&template.CreatedAt,
		&template.UpdatedAt,
		&stringValue,
		&numberValue,
		&booleanValue,
		&jsonValue,
		&updatedAt,
	); err != nil {
		return entity.AttributeValue{}, uuid.Nil, err
	}

	if description.Valid {
		template.Description = description.String
	}
	template.ID = templateID
	template.Metadata = mustMap(metadata)
	template.UISchema = mustMap(uiSchema)

	value := entity.AttributeValue{
		Template:  template,
		OwnerType: template.TargetType,
		OwnerID:   ownerID,
		UpdatedAt: updatedAt,
	}
	if stringValue.Valid {
		value.String = &stringValue.String
	}
	if numberValue.Valid {
		v := numberValue.Float64
		value.Number = &v
	}
	if booleanValue.Valid {
		v := booleanValue.Bool
		value.Boolean = &v
	}
	if len(jsonValue) > 0 {
		value.JSON = mustMap(jsonValue)
	}
	return value, ownerID, nil
}

func valueOrDefaultInt(value int, fallback int) int {
	if value == 0 {
		return fallback
	}
	return value
}
