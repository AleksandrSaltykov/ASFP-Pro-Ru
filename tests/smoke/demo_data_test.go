package smoke

import (
	"net/http"
	"strings"
	"testing"
	"time"
)

func TestDemoDataPresence(t *testing.T) {
	artifactsDir := ensureArtifactsDir(t)
	client := &http.Client{Timeout: 10 * time.Second}
	baseURL := getenv("SMOKE_WMS_URL", "http://localhost:8082")

	nodes := listCatalogNodes(t, client, baseURL, "category", artifactsDir, "wms_catalog_seed.log")
	foundCategory := false
	for _, node := range nodes {
		if strings.EqualFold(node.Code, "SIGNAGE") {
			foundCategory = true
			recordArtifact(t, artifactsDir, "wms_catalog_seed.log", "signage_name=%s", node.Name)
			break
		}
	}
	if !foundCategory {
		recordArtifact(t, artifactsDir, "wms_catalog_seed.log", "items=%d", len(nodes))
		t.Fatalf("expected SIGNAGE category in seed data")
	}

	items := listItems(t, client, baseURL, artifactsDir, "wms_items_seed.log")
	foundItem := false
	for _, item := range items {
		if strings.EqualFold(item.SKU, "DEMO-SIGN-001") {
			foundItem = true
			recordArtifact(t, artifactsDir, "wms_items_seed.log", "demo_item=%s", item.Name)
			break
		}
	}
	if !foundItem {
		recordArtifact(t, artifactsDir, "wms_items_seed.log", "items=%d", len(items))
		t.Fatalf("expected DEMO-SIGN-001 item in seed data")
	}
}
