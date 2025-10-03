package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type currentUserResponse struct {
	ID       uuid.UUID     `json:"id"`
	Email    string        `json:"email"`
	FullName string        `json:"fullName"`
	Roles    []userRoleDTO `json:"roles"`
	OrgUnits []string      `json:"orgUnits"`
}

type userRoleDTO struct {
	Code  string `json:"code"`
	Scope string `json:"scope"`
}

// CurrentUserHandler returns authenticated user profile along with assigned roles and org units.
func CurrentUserHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := currentUser(c)
		if !ok {
			return fiber.ErrUnauthorized
		}

		response := currentUserResponse{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Roles:    make([]userRoleDTO, 0, len(user.Roles)),
			OrgUnits: user.OrgUnits,
		}

		for _, role := range user.Roles {
			response.Roles = append(response.Roles, userRoleDTO{Code: role.Code, Scope: role.Scope})
		}

		return c.JSON(response)
	}
}
