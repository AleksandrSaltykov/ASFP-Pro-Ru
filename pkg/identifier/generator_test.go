package identifier

import "testing"

func TestGeneratorsProducePrefixedCodes(t *testing.T) {
	tests := []struct {
		name   string
		fn     func() string
		prefix string
	}{
		{name: "sku", fn: SKU, prefix: "SKU"},
		{name: "category", fn: CategoryCode, prefix: "GRP"},
		{name: "unit", fn: UnitCode, prefix: "UNT"},
		{name: "warehouse", fn: WarehouseCode, prefix: "WH"},
		{name: "custom", fn: func() string { return WithPrefix("doc") }, prefix: "DOC"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code := tt.fn()
			if len(code) == 0 {
				t.Fatalf("generator returned empty code")
			}
			if len(code) < len(tt.prefix)+2 { // prefix + "-" + suffix
				t.Fatalf("code %q too short", code)
			}
			if want := tt.prefix + "-"; code[:len(want)] != want {
				t.Fatalf("code %q does not start with %q", code, want)
			}
		})
	}
}
