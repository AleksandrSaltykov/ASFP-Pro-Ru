package rbac

import "testing"

func TestMatches(t *testing.T) {
	policy := Policy{Role: RoleSales, Resource: "crm.deal", Action: "create", Scope: "*"}

	if !policy.Matches(RoleSales, "crm.deal", "create", "warehouse-1") {
		t.Fatal("expected wildcard scope to match")
	}

	if policy.Matches(RoleSales, "crm.client", "create", "warehouse-1") {
		t.Fatal("resource should not match")
	}
}

func TestWildcardEqual(t *testing.T) {
	if !wildcardEqual("*", "anything") {
		t.Fatal("wildcard must match")
	}

	if wildcardEqual("crm", "CRM2") {
		t.Fatal("values must not match")
	}
}
