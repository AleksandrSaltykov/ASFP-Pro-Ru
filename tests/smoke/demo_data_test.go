package smoke

import (
	"encoding/json"
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

func TestCRMDemoData(t *testing.T) {
	artifactsDir := ensureArtifactsDir(t)
	client := &http.Client{Timeout: 10 * time.Second}
	baseURL := getenv("SMOKE_CRM_URL", "http://localhost:8081")

	resp, err := client.Get(baseURL + "/api/v1/deals?limit=50")
	if err != nil {
		recordArtifact(t, artifactsDir, "crm_seed.log", "request error: %v", err)
		t.Fatalf("crm deals request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		recordArtifact(t, artifactsDir, "crm_seed.log", "status=%d", resp.StatusCode)
		t.Fatalf("crm deals status %d", resp.StatusCode)
	}

	var payload struct {
		Items []struct {
			Title string `json:"Title"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		recordArtifact(t, artifactsDir, "crm_seed.log", "decode error: %v", err)
		t.Fatalf("decode crm payload: %v", err)
	}

	found := false
	for _, item := range payload.Items {
		if strings.Contains(item.Title, "Демо договор") {
			found = true
			recordArtifact(t, artifactsDir, "crm_seed.log", "demo_title=%s", item.Title)
			break
		}
	}
	if !found {
		recordArtifact(t, artifactsDir, "crm_seed.log", "items=%d", len(payload.Items))
		t.Fatalf("expected demo deal in crm seed data")
	}
}
