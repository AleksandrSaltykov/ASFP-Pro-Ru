package rbac

import "strings"

// Role enumerates base system roles.
type Role string

// Predefined roles aligned with ??????-?????????? ???????? ???????.
const (
	RoleDirector     Role = "director"
	RoleSales        Role = "sales"
	RoleTenders      Role = "tenders"
	RoleDesign       Role = "design"
	RoleEngineering  Role = "engineering"
	RoleProduction   Role = "production"
	RoleWarehouse    Role = "warehouse"
	RoleLogistics    Role = "logistics"
	RoleAccounting   Role = "accounting"
	RoleLegal        Role = "legal"
	RoleInstallation Role = "installation"
	RoleIT           Role = "it"
	RoleClient       Role = "client"
)

// Policy describes access to resource within optional scope.
type Policy struct {
	Role     Role
	Resource string
	Action   string
	Scope    string
}

// Matches verifies policy compatibility with requested operation.
func (p Policy) Matches(role Role, resource, action, scope string) bool {
	if p.Role != role {
		return false
	}
	if !wildcardEqual(p.Resource, resource) {
		return false
	}
	if !wildcardEqual(p.Action, action) {
		return false
	}
	if p.Scope == "*" || p.Scope == scope {
		return true
	}
	return p.Scope == "" && scope == ""
}

func wildcardEqual(pattern, value string) bool {
	if pattern == "*" {
		return true
	}
	return strings.EqualFold(pattern, value)
}
