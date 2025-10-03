package handlers

import (
	"net/mail"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/core"
)

// RegisterCoreRoutes wires core management endpoints under authenticated router.
func RegisterCoreRoutes(router fiber.Router, svc *core.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	router.Get("/api/v1/users", guard("core.user", "read"), listUsersHandler(svc))
	router.Post("/api/v1/users", guard("core.user", "write"), createUserHandler(svc, logger))
	router.Put("/api/v1/users/:id", guard("core.user", "write"), updateUserHandler(svc, logger))

	router.Get("/api/v1/roles", guard("core.role", "read"), listRolesHandler(svc))
	router.Post("/api/v1/roles", guard("core.role", "write"), createRoleHandler(svc, logger))
	router.Get("/api/v1/roles/:code/permissions", guard("core.permission", "read"), listRolePermissionsHandler(svc))
	router.Put("/api/v1/roles/:code/permissions", guard("core.permission", "write"), updateRolePermissionsHandler(svc, logger))

	router.Get("/api/v1/org-units", guard("core.org_unit", "read"), listOrgUnitsHandler(svc))
	router.Post("/api/v1/org-units", guard("core.org_unit", "write"), createOrgUnitHandler(svc, logger))
	router.Put("/api/v1/org-units/:code", guard("core.org_unit", "write"), updateOrgUnitHandler(svc, logger))
	router.Delete("/api/v1/org-units/:code", guard("core.org_unit", "delete"), deleteOrgUnitHandler(svc, logger))

	router.Get("/api/v1/api-tokens", guard("core.api_token", "read"), listAPITokensHandler(svc))
	router.Post("/api/v1/api-tokens", guard("core.api_token", "write"), createAPITokenHandler(svc, logger))
	router.Delete("/api/v1/api-tokens/:id", guard("core.api_token", "write"), revokeAPITokenHandler(svc, logger))
}

type roleAssignmentRequest struct {
	Code           string `json:"code"`
	WarehouseScope string `json:"warehouseScope"`
}

type createUserRequest struct {
	Email    string                  `json:"email"`
	FullName string                  `json:"fullName"`
	Password string                  `json:"password"`
	IsActive *bool                   `json:"isActive"`
	Roles    []roleAssignmentRequest `json:"roles"`
}

type updateUserRequest struct {
	FullName *string                  `json:"fullName"`
	IsActive *bool                    `json:"isActive"`
	Password *string                  `json:"password"`
	Roles    *[]roleAssignmentRequest `json:"roles"`
}

type createOrgUnitRequest struct {
	Code        string         `json:"code"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	ParentCode  string         `json:"parentCode"`
	Metadata    map[string]any `json:"metadata"`
}

type updateOrgUnitRequest struct {
	Name        *string         `json:"name"`
	Description *string         `json:"description"`
	IsActive    *bool           `json:"isActive"`
	Metadata    *map[string]any `json:"metadata"`
}

type permissionItemRequest struct {
	Resource string         `json:"resource"`
	Action   string         `json:"action"`
	Scope    string         `json:"scope"`
	Effect   string         `json:"effect"`
	Metadata map[string]any `json:"metadata"`
}

type updatePermissionsRequest struct {
	Items []permissionItemRequest `json:"items"`
}

type createAPITokenRequest struct {
	Name     string `json:"name"`
	RoleCode string `json:"roleCode"`
	Scope    string `json:"scope"`
}

func listUsersHandler(svc *core.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filter := core.ListUsersFilter{Role: c.Query("role")}
		users, err := svc.ListUsers(c.Context(), filter)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": users})
	}
}

func createUserHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req createUserRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		if _, err := mail.ParseAddress(strings.TrimSpace(req.Email)); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "valid email is required")
		}
		if strings.TrimSpace(req.FullName) == "" {
			return fiber.NewError(fiber.StatusBadRequest, "fullName is required")
		}
		if strings.TrimSpace(req.Password) == "" {
			return fiber.NewError(fiber.StatusBadRequest, "password is required")
		}
		if len(req.Roles) == 0 {
			return fiber.NewError(fiber.StatusBadRequest, "roles are required")
		}

		assignments := make([]core.RoleAssignment, 0, len(req.Roles))
		for _, role := range req.Roles {
			code := strings.TrimSpace(role.Code)
			if code == "" {
				return fiber.NewError(fiber.StatusBadRequest, "role code cannot be empty")
			}
			assignments = append(assignments, core.RoleAssignment{
				Code:           code,
				WarehouseScope: role.WarehouseScope,
			})
		}

		input := core.CreateUserInput{
			Email:    req.Email,
			FullName: req.FullName,
			Password: req.Password,
			IsActive: req.IsActive,
			Roles:    assignments,
		}

		actorID := extractActorID(c)
		user, err := svc.CreateUser(c.Context(), actorID, input)
		if err != nil {
			return mapCoreError(err)
		}

		logger.Info().Str("userId", user.ID.String()).Msg("core user created")
		return c.Status(fiber.StatusCreated).JSON(user)
	}
}

func updateUserHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
		}

		var req updateUserRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		var rolesPtr *[]core.RoleAssignment
		if req.Roles != nil {
			assignments := make([]core.RoleAssignment, 0, len(*req.Roles))
			for _, role := range *req.Roles {
				code := strings.TrimSpace(role.Code)
				if code == "" {
					return fiber.NewError(fiber.StatusBadRequest, "role code cannot be empty")
				}
				assignments = append(assignments, core.RoleAssignment{
					Code:           code,
					WarehouseScope: role.WarehouseScope,
				})
			}
			rolesPtr = &assignments
		}

		input := core.UpdateUserInput{
			FullName: req.FullName,
			IsActive: req.IsActive,
			Password: req.Password,
			Roles:    rolesPtr,
		}

		actorID := extractActorID(c)
		user, err := svc.UpdateUser(c.Context(), actorID, userID, input)
		if err != nil {
			return mapCoreError(err)
		}

		logger.Info().Str("userId", user.ID.String()).Msg("core user updated")
		return c.JSON(user)
	}
}

func listRolesHandler(svc *core.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles, err := svc.ListRoles(c.Context())
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": roles})
	}
}

func createRoleHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		actorID := extractActorID(c)
		role, err := svc.CreateRole(c.Context(), actorID, core.Role{
			Code:        req.Code,
			Description: req.Description,
		})
		if err != nil {
			return mapCoreError(err)
		}

		logger.Info().Str("role", role.Code).Msg("core role created")
		return c.Status(fiber.StatusCreated).JSON(role)
	}
}

func listOrgUnitsHandler(svc *core.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		units, err := svc.ListOrgUnits(c.Context())
		if err != nil {
			return mapCoreError(err)
		}
		return c.JSON(fiber.Map{"items": units})
	}
}

func createOrgUnitHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req createOrgUnitRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}
		actor := extractActorID(c)
		unit, err := svc.CreateOrgUnit(c.Context(), actor, core.CreateOrgUnitInput{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			ParentCode:  req.ParentCode,
			Metadata:    req.Metadata,
		})
		if err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("orgUnit", unit.Code).Msg("core org unit created")
		return c.Status(fiber.StatusCreated).JSON(unit)
	}
}

func updateOrgUnitHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req updateOrgUnitRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}
		actor := extractActorID(c)
		unit, err := svc.UpdateOrgUnit(c.Context(), actor, c.Params("code"), core.UpdateOrgUnitInput{
			Name:        req.Name,
			Description: req.Description,
			IsActive:    req.IsActive,
			Metadata:    req.Metadata,
		})
		if err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("orgUnit", unit.Code).Msg("core org unit updated")
		return c.JSON(unit)
	}
}

func deleteOrgUnitHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		actor := extractActorID(c)
		if err := svc.DeleteOrgUnit(c.Context(), actor, c.Params("code")); err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("orgUnit", c.Params("code")).Msg("core org unit deleted")
		return c.SendStatus(fiber.StatusNoContent)
	}
}

func listRolePermissionsHandler(svc *core.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		perms, err := svc.ListRolePermissions(c.Context(), c.Params("code"))
		if err != nil {
			return mapCoreError(err)
		}
		return c.JSON(fiber.Map{"items": perms})
	}
}

func updateRolePermissionsHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req updatePermissionsRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}
		items := make([]core.RolePermissionInput, 0, len(req.Items))
		for _, item := range req.Items {
			items = append(items, core.RolePermissionInput{
				Resource: item.Resource,
				Action:   item.Action,
				Scope:    item.Scope,
				Effect:   item.Effect,
				Metadata: item.Metadata,
			})
		}
		actor := extractActorID(c)
		permissions, err := svc.UpdateRolePermissions(c.Context(), actor, c.Params("code"), items)
		if err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("role", c.Params("code")).Int("count", len(permissions)).Msg("core permissions updated")
		return c.JSON(fiber.Map{"items": permissions})
	}
}

func listAPITokensHandler(svc *core.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokens, err := svc.ListAPITokens(c.Context())
		if err != nil {
			return mapCoreError(err)
		}
		return c.JSON(fiber.Map{"items": tokens})
	}
}

func createAPITokenHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req createAPITokenRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}
		actor := extractActorID(c)
		token, err := svc.CreateAPIToken(c.Context(), actor, core.CreateAPITokenInput{
			Name:     req.Name,
			RoleCode: req.RoleCode,
			Scope:    req.Scope,
		})
		if err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("tokenId", token.ID.String()).Msg("core api token created")
		return c.Status(fiber.StatusCreated).JSON(token)
	}
}

func revokeAPITokenHandler(svc *core.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid token id")
		}
		actor := extractActorID(c)
		token, err := svc.RevokeAPIToken(c.Context(), actor, id)
		if err != nil {
			return mapCoreError(err)
		}
		logger.Info().Str("tokenId", token.ID.String()).Msg("core api token revoked")
		return c.JSON(token)
	}
}

func mapCoreError(err error) error {
	switch err {
	case nil:
		return nil
	case core.ErrDuplicateEmail:
		return fiber.NewError(fiber.StatusConflict, "email already exists")
	case core.ErrRoleNotFound:
		return fiber.NewError(fiber.StatusBadRequest, "unknown role referenced")
	case core.ErrUserNotFound:
		return fiber.NewError(fiber.StatusNotFound, "user not found")
	case core.ErrDuplicateRole:
		return fiber.NewError(fiber.StatusConflict, "role already exists")
	case core.ErrOrgUnitNotFound:
		return fiber.NewError(fiber.StatusNotFound, "org unit not found")
	case core.ErrOrgUnitConflict:
		return fiber.NewError(fiber.StatusConflict, "org unit already exists")
	case core.ErrOrgUnitHasChildren:
		return fiber.NewError(fiber.StatusBadRequest, "org unit has children")
	case core.ErrAPITokenConflict:
		return fiber.NewError(fiber.StatusConflict, "api token already exists")
	case core.ErrAPITokenNotFound:
		return fiber.NewError(fiber.StatusNotFound, "api token not found")
	default:
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
}

func extractActorID(c *fiber.Ctx) uuid.UUID {
	if user, ok := currentUser(c); ok {
		return user.ID
	}
	return uuid.Nil
}
