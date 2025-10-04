package handler

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"asfppro/modules/wms/internal/entity"
)

func TestItemRequestToEntity_Success(t *testing.T) {
	templateID := uuid.New()
	unitID := uuid.New()
	categoryID := uuid.New()
	warehouseID := uuid.New()

	req := itemRequest{
		SKU:          "SKU-1",
		Name:         "Item",
		Description:  "Sample",
		CategoryID:   categoryID.String(),
		UnitID:       unitID.String(),
		Barcode:      "123",
		WarehouseIDs: []string{warehouseID.String()},
		Metadata:     map[string]any{"key": "value"},
		Attributes: []attributeValueRequest{
			{
				TemplateID: templateID.String(),
				String:     ptrString("value"),
			},
		},
	}

	item, attrs, err := req.toEntity()
	require.NoError(t, err)
	require.Equal(t, "SKU-1", item.SKU)
	require.Equal(t, unitID, item.UnitID)
	require.NotNil(t, item.Metadata)
	require.Len(t, item.Warehouses, 1)
	require.Equal(t, warehouseID, item.Warehouses[0])
	require.NotNil(t, item.CategoryID)
	require.Equal(t, categoryID, *item.CategoryID)
	require.Len(t, attrs, 1)
	require.Equal(t, templateID, attrs[0].TemplateID)
}

func TestItemRequestToEntity_InvalidUnit(t *testing.T) {
	req := itemRequest{UnitID: "invalid"}
	_, _, err := req.toEntity()
	require.Error(t, err)
}

func TestItemRequestToEntity_InvalidAttribute(t *testing.T) {
	unitID := uuid.New()
	req := itemRequest{
		SKU:    "SKU",
		Name:   "Name",
		UnitID: unitID.String(),
		Attributes: []attributeValueRequest{
			{TemplateID: ""},
		},
	}
	_, _, err := req.toEntity()
	require.Error(t, err)
}

func TestCatalogNodeRequestToEntity(t *testing.T) {
	parentID := uuid.New()
	req := catalogNodeRequest{
		ParentID: parentID.String(),
		Code:     "CODE",
		Name:     "Name",
		Metadata: map[string]any{"type": "test"},
	}

	node, err := req.toEntity()
	require.NoError(t, err)
	require.Equal(t, "CODE", node.Code)
	require.NotNil(t, node.ParentID)
	require.Equal(t, parentID, *node.ParentID)
	require.True(t, node.IsActive)
}

func TestAttributeTemplateRequestToEntity(t *testing.T) {
	req := attributeTemplateRequest{
		Code:        " color ",
		Name:        "Color",
		Description: "Main color",
		TargetType:  "item",
		DataType:    "string",
		IsRequired:  ptrBool(true),
		Position:    ptrInt(50),
		Metadata:    map[string]any{"options": []string{"red", "blue"}},
		UISchema:    map[string]any{"component": "Select"},
	}
	template := req.toEntity()
	require.Equal(t, " color ", template.Code)
	require.Equal(t, "Color", template.Name)
	require.Equal(t, "Main color", template.Description)
	require.Equal(t, entity.AttributeDataType("string"), template.DataType)
	require.True(t, template.IsRequired)
	require.Equal(t, 50, template.Position)
	require.Equal(t, map[string]any{"options": []string{"red", "blue"}}, template.Metadata)
	require.Equal(t, map[string]any{"component": "Select"}, template.UISchema)
}

func TestAttributeValueRequestToUpsert(t *testing.T) {
	tpl := uuid.New()
	req := attributeValueRequest{TemplateID: tpl.String()}
	upsert, err := req.toUpsert()
	require.NoError(t, err)
	require.Equal(t, tpl, upsert.TemplateID)
}

func ptrString(v string) *string {
	return &v
}


func ptrBool(v bool) *bool {
	return &v
}

func ptrInt(v int) *int {
	return &v
}
