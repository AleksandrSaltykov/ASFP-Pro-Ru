package core

import "errors"

var (
	// ErrDuplicateEmail is returned when creating user with existing email.
	ErrDuplicateEmail = errors.New("email already in use")
	// ErrRoleNotFound indicates input references unknown roles.
	ErrRoleNotFound = errors.New("role not found")
	// ErrUserNotFound signals that user does not exist.
	ErrUserNotFound = errors.New("user not found")
	// ErrDuplicateRole indicates role with code already exists.
	ErrDuplicateRole = errors.New("role already exists")
	// ErrOrgUnitNotFound indicates requested org unit is missing.
	ErrOrgUnitNotFound = errors.New("org unit not found")
	// ErrOrgUnitConflict signals org unit with code already exists.
	ErrOrgUnitConflict = errors.New("org unit already exists")
	// ErrOrgUnitHasChildren is returned when trying to delete org unit with nested children.
	ErrOrgUnitHasChildren = errors.New("org unit has children")
	// ErrAPITokenConflict indicates token name already exists.
	ErrAPITokenConflict = errors.New("api token already exists")
	// ErrAPITokenNotFound indicates token not found or already revoked.
	ErrAPITokenNotFound = errors.New("api token not found")
)
