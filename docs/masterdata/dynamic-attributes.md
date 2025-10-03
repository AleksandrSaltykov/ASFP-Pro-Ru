# Dynamic Attribute Contract

This document describes the contract for dynamic attribute templates and values that power
WMS master data. It covers the storage schema, API payloads, and invariants that downstream
services and UI clients rely on.

## Attribute templates (`wms.attribute_templates`)

Each template defines a configurable field that can be attached to domain objects. Templates
are identified by UUID and grouped by `target_type` (for example `item`).

Required columns and their meaning:

| Column        | Type      | Notes |
|---------------|-----------|-------|
| `id`          | uuid      | Primary key; generated when not provided.
| `code`        | text      | Stable machine-readable code; unique per target.
| `name`        | text      | Human readable label displayed in UI.
| `description` | text      | Optional helper text for editors.
| `target_type` | text      | Domain bucket (e.g. `item`, `warehouse`).
| `data_type`   | text      | One of `string`, `number`, `boolean`, `json`.
| `is_required` | boolean   | Enforces presence of a value on create/update.
| `metadata`    | jsonb     | Arbitrary contract data (unit, ranges, defaults).
| `ui_schema`   | jsonb     | UI hinting (component, options, formatting).
| `position`    | smallint  | Ordering index used for deterministic rendering.
| `created_at`  | timestamptz | Audit timestamp (UTC).
| `updated_at`  | timestamptz | Audit timestamp (UTC).

Constraints:
- `(target_type, code)` must be unique.
- `data_type` is limited to the four enumerated values above.
- Templates are immutable in shape; changes should be tracked via migrations or seeds to
  preserve referential integrity.

`metadata` and `ui_schema` are intentionally free-form JSON objects. Backend code does not
interpret their contents, but UI clients rely on shared keys. When introducing new keys,
update the front-end mapping alongside this document.

## Attribute values (`wms.attribute_values`)

Values represent a template applied to a specific entity. The primary key is
`(owner_type, owner_id, template_id)` which allows multiple domains to reuse the same
template definitions.

Relevant columns:

| Column          | Type      | Notes |
|-----------------|-----------|-------|
| `owner_type`    | text      | Logical domain (`item` today, extensible later).
| `owner_id`      | uuid      | Reference to the entity instance.
| `template_id`   | uuid      | Foreign key to `wms.attribute_templates`.
| `string_value`  | text      | Populated when `data_type = string`.
| `number_value`  | numeric   | Populated when `data_type = number` (20,6 precision).
| `boolean_value` | boolean   | Populated when `data_type = boolean`.
| `json_value`    | jsonb     | Populated when `data_type = json`.
| `updated_at`    | timestamptz | Updated by triggers/service layer.

Exactly one of the typed value columns is expected to be non-null depending on the template
`data_type`. The service layer normalizes missing optional values:
- optional string -> empty string; required string must be provided explicitly.
- optional boolean -> `false`; required boolean must be provided explicitly.
- optional number -> remains null; required number must be provided explicitly.
- optional JSON -> `{}` when omitted.

## API surface

The master data API exposes the following endpoints related to dynamic attributes:
- `GET /api/v1/master-data/attribute-templates?targetType=item` - returns the ordered list
  of templates for the given target. If the query parameter is omitted, `item` is used.
- `GET /api/v1/master-data/items` - returns items enriched with resolved attribute values.
- `GET /api/v1/master-data/items/:itemId` - returns a single item with attributes.
- `POST /api/v1/master-data/items` - accepts item payload plus `attributes` array.
- `PUT /api/v1/master-data/items/:itemId` - same contract as create; replaces attribute
  values atomically.

`attributes` array format in create/update payloads:

```json
{
  "templateId": "10000000-0000-0000-0000-000000000001",
  "stringValue": "Blue",
  "numberValue": null,
  "booleanValue": null,
  "jsonValue": null
}
```

Only the value field that matches the template `data_type` should be populated. The handler
uses the provided `templateId` to look up type information and rejects:
- missing `templateId` or malformed UUID;
- references to templates that do not exist or belong to another target;
- duplicate template references within the same payload;
- missing values for templates marked `is_required`.

Responses return a fully resolved structure:

```json
{
  "template": {
    "id": "10000000-0000-0000-0000-000000000002",
    "code": "width_mm",
    "name": "Width, mm",
    "dataType": "number",
    "isRequired": true,
    "metadata": {"unit": "mm"},
    "uiSchema": {"component": "NumberInput", "step": 1},
    "position": 20
  },
  "numberValue": 2400,
  "updatedAt": "2025-09-29T18:40:00Z"
}
```

Clients should rely on the `template` object for display metadata instead of hardcoding
labels or input controls.

## Validation summary

The service enforces the following rules when items are created or updated:
- every attribute payload must reference an existing template for target `item`;
- template codes are unique, so providing the same `templateId` twice fails the request;
- required templates must be satisfied with a value of the expected type;
- extra value fields are ignored; only the matching typed field is persisted;
- attribute updates are transactional: the previous values for `(owner_type, owner_id)` are
  deleted before inserts, guaranteeing read-after-write consistency.

## Example flow

1. Fetch available templates:
   ```http
   GET /api/v1/master-data/attribute-templates?targetType=item
   ```
2. Render form fields based on `dataType`, `metadata`, and `uiSchema`.
3. Submit item payload:
   ```json
   {
     "sku": "DEMO-SIGN-002",
     "name": "Demo signage v2",
     "unitId": "<unit-uuid>",
     "attributes": [
       {"templateId": "...0001", "stringValue": "Blue"},
       {"templateId": "...0002", "numberValue": 2500},
       {"templateId": "...0003", "booleanValue": true}
     ]
   }
   ```
4. The service normalizes optional fields, validates required ones, and persists values to
   `wms.attribute_values`.

## Extensibility notes

- To support another domain (e.g. warehouse metadata), create templates with a new
  `target_type` and extend the service/repository layer to fetch and validate them.
- Seed data should use deterministic UUIDs where stable references are required (see
  `modules/wms/migrations/0004_seed_dynamic_masterdata.sql`).
- Any change to the contract must be reflected in automated smoke/e2e tests to guard
  against regressions.
- Follow docs/masterdata/how-to-extend-directories.md for seed and rollout workflow when adding new templates or demo data.
