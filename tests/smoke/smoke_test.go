package smoke

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type service struct {
	name string
	url  string
}

type uploadResponse struct {
	URL     string `json:"url"`
	Version string `json:"version"`
}

type catalogList struct {
	Items []struct {
		Code string `json:"code"`
		Name string `json:"name"`
	} `json:"items"`
}

type itemList struct {
	Items []struct {
		SKU  string `json:"sku"`
		Name string `json:"name"`
	} `json:"items"`
}

type currentUserPayload struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"fullName"`
	Roles    []struct {
		Code  string `json:"code"`
		Scope string `json:"scope"`
	} `json:"roles"`
	OrgUnits []string `json:"orgUnits"`
}

func TestSmokeEndpoints(t *testing.T) {
	artifactsDir := ensureArtifactsDir(t)

	services := []service{
		{name: "gateway", url: getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")},
		{name: "crm", url: getenv("SMOKE_CRM_URL", "http://localhost:8081")},
		{name: "wms", url: getenv("SMOKE_WMS_URL", "http://localhost:8082")},
	}

	authHeader := smokeAuthHeader()
	client := &http.Client{Timeout: 10 * time.Second}

	for _, svc := range services {
		svc := svc
		t.Run(svc.name+"_health", func(t *testing.T) {
			resp, err := client.Get(svc.url + "/health")
			if err != nil {
				recordArtifact(t, artifactsDir, fmt.Sprintf("%s_health.log", svc.name), "error: %v", err)
				t.Fatalf("%s health request failed: %v", svc.name, err)
			}
			defer resp.Body.Close()

			recordArtifact(t, artifactsDir, fmt.Sprintf("%s_health.log", svc.name), "status=%d", resp.StatusCode)
			if resp.StatusCode != http.StatusOK {
				t.Fatalf("%s health status: %d", svc.name, resp.StatusCode)
			}
		})

		t.Run(svc.name+"_ready", func(t *testing.T) {
			resp, err := client.Get(svc.url + "/ready")
			if err != nil {
				t.Fatalf("%s ready request failed: %v", svc.name, err)
			}
			t.Cleanup(func() { _ = resp.Body.Close() })

			if resp.StatusCode != http.StatusOK {
				body, _ := io.ReadAll(resp.Body)
				t.Fatalf("%s ready status: %d body %s", svc.name, resp.StatusCode, string(body))
			}

			var payload struct {
				Status string            `json:"status"`
				Checks map[string]string `json:"checks"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
				t.Fatalf("decode ready payload: %v", err)
			}

			if payload.Status != "ok" {
				t.Fatalf("%s ready status payload: %s", svc.name, payload.Status)
			}

			for name, status := range payload.Checks {
				if status != "ok" {
					t.Fatalf("%s dependency %s status %s", svc.name, name, status)
				}
			}
		})

		t.Run(svc.name+"_openapi", func(t *testing.T) {
			resp, err := client.Get(svc.url + "/openapi.json")
			if err != nil {
				recordArtifact(t, artifactsDir, fmt.Sprintf("%s_openapi.log", svc.name), "error: %v", err)
				t.Fatalf("%s openapi request failed: %v", svc.name, err)
			}
			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				recordArtifact(t, artifactsDir, fmt.Sprintf("%s_openapi.log", svc.name), "read error: %v", err)
				t.Fatalf("read openapi body: %v", err)
			}
			recordArtifact(t, artifactsDir, fmt.Sprintf("%s_openapi.log", svc.name), "status=%d bytes=%d", resp.StatusCode, len(body))

			if resp.StatusCode != http.StatusOK {
				t.Fatalf("%s openapi status: %d", svc.name, resp.StatusCode)
			}
			if len(body) == 0 {
				t.Fatalf("%s openapi body is empty", svc.name)
			}
			if ct := resp.Header.Get("Content-Type"); ct != "" && !strings.Contains(ct, "json") {
				t.Fatalf("%s openapi content-type unexpected: %s", svc.name, ct)
			}
		})
	}

	gatewayURL := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")

	t.Run("gateway_file_upload", func(t *testing.T) {
		folder := fmt.Sprintf("smoke/%d", time.Now().UnixNano())
		resp := uploadFile(t, client, gatewayURL, authHeader, folder, "smoke.txt", []byte("smoke-test"), artifactsDir, "gateway_upload.log")
		if resp.URL == "" {
			t.Fatalf("empty URL in response")
		}
	})

	t.Run("gateway_file_upload_multiple", func(t *testing.T) {
		folder := fmt.Sprintf("smoke/multi-%d", time.Now().UnixNano())
		files := []struct {
			name    string
			content []byte
		}{
			{name: "sample-1.txt", content: []byte("sample-one")},
			{name: "sample-2.txt", content: []byte("sample-two")},
		}
		for _, f := range files {
			resp := uploadFile(t, client, gatewayURL, authHeader, folder, f.name, f.content, artifactsDir, "gateway_upload_multi.log")
			if resp.URL == "" {
				t.Fatalf("empty URL for %s", f.name)
			}
		}
	})

	t.Run("gateway_file_upload_invalid_auth", func(t *testing.T) {
		folder := fmt.Sprintf("smoke/%d", time.Now().UnixNano())
		buf := new(bytes.Buffer)
		writer := multipart.NewWriter(buf)

		fw, err := writer.CreateFormFile("file", "unauthorized.txt")
		if err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "form error: %v", err)
			t.Fatalf("create form file: %v", err)
		}
		if _, err := fw.Write([]byte("unauthorized")); err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "payload error: %v", err)
			t.Fatalf("write payload: %v", err)
		}
		if err := writer.WriteField("folder", folder); err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "folder error: %v", err)
			t.Fatalf("write folder field: %v", err)
		}
		if err := writer.Close(); err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "close error: %v", err)
			t.Fatalf("close writer: %v", err)
		}

		req, err := http.NewRequest(http.MethodPost, gatewayURL+"/api/v1/files", buf)
		if err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "request error: %v", err)
			t.Fatalf("prepare request: %v", err)
		}
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte("wrong:creds")))

		recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "attempt folder=%s", folder)
		resp, err := client.Do(req)
		if err != nil {
			recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "request failed: %v", err)
			t.Fatalf("upload request: %v", err)
		}
		defer resp.Body.Close()

		recordArtifact(t, artifactsDir, "gateway_invalid_auth.log", "status=%d", resp.StatusCode)
		if resp.StatusCode != http.StatusUnauthorized {
			body, _ := io.ReadAll(resp.Body)
			t.Fatalf("expected 401, got %d body %s", resp.StatusCode, string(body))
		}
	})

	t.Run("gateway_auth_me", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, gatewayURL+"/api/v1/auth/me", nil)
		if err != nil {
			t.Fatalf("prepare auth me request: %v", err)
		}
		req.Header.Set("Authorization", authHeader)
		req.Header.Set("Content-Type", "application/json")

		artifact := "gateway_auth_me.log"
		recordArtifact(t, artifactsDir, artifact, "request")

		resp, err := client.Do(req)
		if err != nil {
			recordArtifact(t, artifactsDir, artifact, "error: %v", err)
			t.Fatalf("auth me request failed: %v", err)
		}
		defer resp.Body.Close()

		recordArtifact(t, artifactsDir, artifact, "status=%d", resp.StatusCode)
		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			t.Fatalf("unexpected status %d body %s", resp.StatusCode, string(body))
		}

		var payload currentUserPayload
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			t.Fatalf("decode auth me payload: %v", err)
		}

		if payload.ID == "" || payload.Email == "" {
			t.Fatalf("auth payload missing identifiers: %+v", payload)
		}
		if len(payload.Roles) == 0 {
			t.Fatalf("expected at least one role in payload")
		}
	})

	t.Run("gateway_core_rbac", func(t *testing.T) {
		artifact := "core_rbac.log"
		orgCode := fmt.Sprintf("BRANCH-%d", time.Now().UnixNano())
		payload := map[string]any{
			"code":       orgCode,
			"name":       "Smoke Branch",
			"parentCode": "HQ",
		}
		status, body := jsonRequestWithAuth(t, client, http.MethodPost, gatewayURL+"/api/v1/org-units", payload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create org unit status %d body %s", status, string(body))
		}
		var createdOrg struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(body, &createdOrg); err != nil {
			t.Fatalf("decode org unit: %v", err)
		}
		updatePayload := map[string]any{
			"name":     "Smoke Branch Updated",
			"isActive": true,
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/org-units/%s", gatewayURL, createdOrg.Code), updatePayload, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update org unit status %d body %s", status, string(body))
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodGet, gatewayURL+"/api/v1/org-units", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list org units status %d", status)
		}
		permPayload := map[string]any{
			"items": []map[string]any{{
				"resource": "crm.deal",
				"action":   "approve",
				"scope":    createdOrg.Code,
				"effect":   "allow",
			}},
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, gatewayURL+"/api/v1/roles/director/permissions", permPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update permissions status %d body %s", status, string(body))
		}
		var perms struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &perms); err != nil {
			t.Fatalf("decode permissions: %v", err)
		}
		if len(perms.Items) == 0 {
			t.Fatalf("expected permissions")
		}
		tokenPayload := map[string]any{
			"name":     fmt.Sprintf("Smoke Token %d", time.Now().UnixNano()),
			"roleCode": "director",
			"scope":    createdOrg.Code,
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, gatewayURL+"/api/v1/api-tokens", tokenPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create api token status %d body %s", status, string(body))
		}
		var tokenResp struct {
			ID    string `json:"id"`
			Token string `json:"token"`
		}
		if err := json.Unmarshal(body, &tokenResp); err != nil {
			t.Fatalf("decode token: %v", err)
		}
		if tokenResp.Token == "" {
			t.Fatalf("token secret empty")
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodGet, gatewayURL+"/api/v1/api-tokens", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list api tokens status %d", status)
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodDelete, fmt.Sprintf("%s/api/v1/api-tokens/%s", gatewayURL, tokenResp.ID), nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("revoke api token status %d body %s", status, string(body))
		}
	})

	if httpsURL := strings.TrimSpace(os.Getenv("SMOKE_GATEWAY_HTTPS_URL")); httpsURL != "" {
		t.Run("gateway_https_health", func(t *testing.T) {
			url := strings.TrimSuffix(httpsURL, "/") + "/health"
			recordArtifact(t, artifactsDir, "gateway_https.log", "attempt url=%s", url)
			resp, err := client.Get(url)
			if err != nil {
				recordArtifact(t, artifactsDir, "gateway_https.log", "request error: %v", err)
				t.Fatalf("https health request failed: %v", err)
			}
			defer resp.Body.Close()

			recordArtifact(t, artifactsDir, "gateway_https.log", "status=%d", resp.StatusCode)
			if resp.StatusCode != http.StatusOK {
				t.Fatalf("https health status: %d", resp.StatusCode)
			}
		})
	}

	t.Run("crm_deals_list", func(t *testing.T) {
		url := getenv("SMOKE_CRM_URL", "http://localhost:8081") + "/api/v1/deals?limit=50"
		recordArtifact(t, artifactsDir, "crm_deals.log", "request url=%s", url)
		resp, err := client.Get(url)
		if err != nil {
			recordArtifact(t, artifactsDir, "crm_deals.log", "request error: %v", err)
			t.Fatalf("crm list request failed: %v", err)
		}
		defer resp.Body.Close()

		recordArtifact(t, artifactsDir, "crm_deals.log", "status=%d", resp.StatusCode)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("crm list status: %d", resp.StatusCode)
		}

		var payload struct {
			Items []struct {
				Title string `json:"Title"`
			} `json:"items"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			recordArtifact(t, artifactsDir, "crm_deals.log", "decode error: %v", err)
			t.Fatalf("decode crm list: %v", err)
		}
		recordArtifact(t, artifactsDir, "crm_deals.log", "items=%d", len(payload.Items))

		if len(payload.Items) == 0 {
			t.Fatalf("crm deals list is empty")
		}

		foundDemo := false
		for _, item := range payload.Items {
			if strings.Contains(item.Title, "Демо договор") {
				recordArtifact(t, artifactsDir, "crm_deals.log", "demo_title=%s", item.Title)
				foundDemo = true
				break
			}
		}
		if !foundDemo {
			t.Fatalf("expected demo deal in crm list")
		}
	})

	t.Run("crm_deal_history_demo", func(t *testing.T) {
		base := getenv("SMOKE_CRM_URL", "http://localhost:8081")
		url := base + "/api/v1/deals/31000000-0000-0000-0000-000000000001/history?limit=5"
		recordArtifact(t, artifactsDir, "crm_deal_history.log", "request url=%s", url)
		resp, err := client.Get(url)
		if err != nil {
			recordArtifact(t, artifactsDir, "crm_deal_history.log", "request error: %v", err)
			t.Fatalf("crm history request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			recordArtifact(t, artifactsDir, "crm_deal_history.log", "status=%d", resp.StatusCode)
			t.Fatalf("crm history status %d", resp.StatusCode)
		}

		var payload struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			recordArtifact(t, artifactsDir, "crm_deal_history.log", "decode error: %v", err)
			t.Fatalf("decode crm history: %v", err)
		}
		recordArtifact(t, artifactsDir, "crm_deal_history.log", "events=%d", len(payload.Items))
		if len(payload.Items) == 0 {
			t.Fatalf("expected events in crm history")
		}
	})

	t.Run("gateway_crm_customer_deal_crud", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		authHeader := smokeAuthHeader()
		const customerArtifact = "gateway_crm_customer.log"
		const dealArtifact = "gateway_crm_deal.log"

		custName := fmt.Sprintf("Gateway Customer %d", time.Now().UnixNano())
		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/crm/customers",
			map[string]any{"name": custName, "inn": "7701234567"}, artifactsDir, customerArtifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("gateway create customer status %d body %s", status, string(body))
		}
		var customer gatewayCustomer
		if err := json.Unmarshal(body, &customer); err != nil {
			t.Fatalf("decode gateway customer: %v", err)
		}

		updatedName := customer.Name + " Updated"
		status, body = jsonRequestWithAuth(t, client, http.MethodPut,
			fmt.Sprintf("%s/api/v1/crm/customers/%s", base, customer.ID),
			map[string]any{"name": updatedName}, artifactsDir, customerArtifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway update customer status %d body %s", status, string(body))
		}

		dealPayload := map[string]any{
			"title":      fmt.Sprintf("Gateway Deal %d", time.Now().UnixNano()),
			"customerId": customer.ID,
			"amount":     123000.0,
			"stage":      "qualification",
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/crm/deals", dealPayload, artifactsDir, dealArtifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("gateway create deal status %d body %s", status, string(body))
		}
		var deal gatewayDeal
		if err := json.Unmarshal(body, &deal); err != nil {
			t.Fatalf("decode gateway deal: %v", err)
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPut,
			fmt.Sprintf("%s/api/v1/crm/deals/%s", base, deal.ID),
			map[string]any{"stage": "won", "amount": 150000}, artifactsDir, dealArtifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway update deal status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/crm/deals?limit=50", nil, artifactsDir, dealArtifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway list deals status %d", status)
		}
		var dealsResp struct {
			Items []gatewayDeal `json:"items"`
		}
		if err := json.Unmarshal(body, &dealsResp); err != nil {
			t.Fatalf("decode gateway deals list: %v", err)
		}
		if len(dealsResp.Items) == 0 {
			t.Fatalf("expected deals in gateway list")
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet,
			fmt.Sprintf("%s/api/v1/crm/deals/%s/history?limit=5", base, deal.ID), nil,
			artifactsDir, dealArtifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway deal history status %d", status)
		}
	})

	t.Run("wms_master_data_catalog_crud", func(t *testing.T) {
		baseURL := getenv("SMOKE_WMS_URL", "http://localhost:8082")
		code := fmt.Sprintf("SMOKE-CAT-%d", time.Now().UnixNano())
		const artifact = "wms_catalog.log"

		status, body := jsonRequest(t, client, http.MethodPost, fmt.Sprintf("%s/api/v1/master-data/catalog/custom", baseURL), map[string]any{
			"code":        code,
			"name":        "Smoke Catalog",
			"description": "smoke category",
		}, artifactsDir, artifact)
		if status != http.StatusCreated {
			t.Fatalf("create catalog status: %d body %s", status, string(body))
		}
		var created catalogNode
		if err := json.Unmarshal(body, &created); err != nil {
			t.Fatalf("decode catalog create: %v", err)
		}
		if created.ID == "" {
			t.Fatalf("catalog id is empty")
		}

		nodes := listCatalogNodes(t, client, baseURL, "custom", artifactsDir, artifact)
		if !containsCatalogCode(nodes, code) {
			t.Fatalf("catalog code %s not found in list", code)
		}

		status, _ = jsonRequest(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/master-data/catalog/custom/%s", baseURL, created.ID), map[string]any{
			"code":        code,
			"name":        "Smoke Catalog Updated",
			"description": "updated by smoke",
		}, artifactsDir, artifact)
		if status != http.StatusOK {
			t.Fatalf("update catalog status: %d", status)
		}

		status, _ = jsonRequest(t, client, http.MethodDelete, fmt.Sprintf("%s/api/v1/master-data/catalog/custom/%s", baseURL, created.ID), nil, artifactsDir, artifact)
		if status != http.StatusNoContent {
			t.Fatalf("delete catalog status: %d", status)
		}
	})

	t.Run("wms_master_data_item_crud", func(t *testing.T) {
		baseURL := getenv("SMOKE_WMS_URL", "http://localhost:8082")
		const artifact = "wms_items.log"

		unitCode := fmt.Sprintf("SMOKE-UNIT-%d", time.Now().UnixNano())
		unitStatus, unitBody := jsonRequest(t, client, http.MethodPost, fmt.Sprintf("%s/api/v1/master-data/catalog/unit", baseURL), map[string]any{
			"code": unitCode,
			"name": "Smoke Unit",
		}, artifactsDir, artifact)
		if unitStatus != http.StatusCreated {
			t.Fatalf("create unit status: %d body %s", unitStatus, string(unitBody))
		}
		var unit catalogNode
		if err := json.Unmarshal(unitBody, &unit); err != nil {
			t.Fatalf("decode unit create: %v", err)
		}
		if unit.ID == "" {
			t.Fatalf("unit id is empty")
		}
		defer func(id string) {
			status, body := jsonRequest(t, client, http.MethodDelete, fmt.Sprintf("%s/api/v1/master-data/catalog/unit/%s", baseURL, id), nil, artifactsDir, artifact)
			if status != http.StatusNoContent && status != http.StatusNotFound {
				t.Errorf("cleanup unit status: %d body %s", status, string(body))
			}
		}(unit.ID)

		categoryCode := fmt.Sprintf("SMOKE-CATEGORY-%d", time.Now().UnixNano())
		categoryStatus, categoryBody := jsonRequest(t, client, http.MethodPost, fmt.Sprintf("%s/api/v1/master-data/catalog/category", baseURL), map[string]any{
			"code": categoryCode,
			"name": "Smoke Category",
		}, artifactsDir, artifact)
		if categoryStatus != http.StatusCreated {
			t.Fatalf("create category status: %d body %s", categoryStatus, string(categoryBody))
		}
		var category catalogNode
		if err := json.Unmarshal(categoryBody, &category); err != nil {
			t.Fatalf("decode category create: %v", err)
		}
		if category.ID == "" {
			t.Fatalf("category id is empty")
		}
		defer func(id string) {
			status, body := jsonRequest(t, client, http.MethodDelete, fmt.Sprintf("%s/api/v1/master-data/catalog/category/%s", baseURL, id), nil, artifactsDir, artifact)
			if status != http.StatusNoContent && status != http.StatusNotFound {
				t.Errorf("cleanup category status: %d body %s", status, string(body))
			}
		}(category.ID)

		templates := listAttributeTemplates(t, client, baseURL, artifactsDir, artifact)
		colorID, colorOK := templates["color"]
		widthID, widthOK := templates["width_mm"]

		attributes := make([]map[string]any, 0, 2)
		if colorOK {
			attributes = append(attributes, map[string]any{
				"templateId":  colorID,
				"stringValue": "Blue",
			})
		}
		if widthOK {
			attributes = append(attributes, map[string]any{
				"templateId":  widthID,
				"numberValue": 2400,
			})
		}

		sku := fmt.Sprintf("SMOKE-ITEM-%d", time.Now().UnixNano())

		createPayload := map[string]any{
			"sku":        sku,
			"name":       "Smoke Item",
			"categoryId": category.ID,
			"unitId":     unit.ID,
			"metadata":   map[string]any{"smoke": true},
		}
		if len(attributes) > 0 {
			createPayload["attributes"] = attributes
		}

		status, body := jsonRequest(t, client, http.MethodPost, fmt.Sprintf("%s/api/v1/master-data/items", baseURL), createPayload, artifactsDir, artifact)
		if status != http.StatusCreated {
			t.Fatalf("create item status: %d body %s", status, string(body))
		}
		var created struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(body, &created); err != nil {
			t.Fatalf("decode item create: %v", err)
		}
		if created.ID == "" {
			t.Fatalf("item id is empty")
		}

		items := listItems(t, client, baseURL, artifactsDir, artifact)
		if !containsItemSKU(items, sku) {
			t.Fatalf("item %s not found in list", sku)
		}

		updatePayload := map[string]any{
			"sku":      sku,
			"name":     "Smoke Item Updated",
			"unitId":   unit.ID,
			"metadata": map[string]any{"smoke": true, "updated": true},
		}
		if colorOK {
			updatePayload["attributes"] = []map[string]any{
				{"templateId": colorID, "stringValue": "Red"},
			}
		}

		status, body = jsonRequest(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/master-data/items/%s", baseURL, created.ID), updatePayload, artifactsDir, artifact)
		if status != http.StatusOK {
			t.Fatalf("update item status: %d body %s", status, string(body))
		}

		status, body = jsonRequest(t, client, http.MethodGet, fmt.Sprintf("%s/api/v1/master-data/items/%s", baseURL, created.ID), nil, artifactsDir, artifact)
		if status != http.StatusOK {
			t.Fatalf("get item status: %d body %s", status, string(body))
		}
		var fetched struct {
			ID         string           `json:"id"`
			Name       string           `json:"name"`
			Attributes []map[string]any `json:"attributes"`
		}
		if err := json.Unmarshal(body, &fetched); err != nil {
			t.Fatalf("decode item get: %v", err)
		}
		if fetched.Name != "Smoke Item Updated" {
			t.Fatalf("unexpected item name: %s", fetched.Name)
		}
		if colorOK && len(fetched.Attributes) == 0 {
			t.Fatalf("expected attributes in response")
		}

		status, body = jsonRequest(t, client, http.MethodDelete, fmt.Sprintf("%s/api/v1/master-data/items/%s", baseURL, created.ID), nil, artifactsDir, artifact)
		if status != http.StatusNoContent {
			t.Fatalf("delete item status: %d body %s", status, string(body))
		}

		status, body = jsonRequest(t, client, http.MethodGet, fmt.Sprintf("%s/api/v1/master-data/items/%s", baseURL, created.ID), nil, artifactsDir, artifact)
		if status != http.StatusNotFound {
			t.Fatalf("expected 404 after delete, got %d body %s", status, string(body))
		}
	})

	t.Run("wms_stock_upsert_and_list", func(t *testing.T) {
		baseURL := getenv("SMOKE_WMS_URL", "http://localhost:8082")
		sku := fmt.Sprintf("SMOKE-%d", time.Now().UnixNano())
		warehouse := fmt.Sprintf("msk-smoke-%d", time.Now().UnixNano())
		body, err := json.Marshal(map[string]any{
			"sku":       sku,
			"warehouse": warehouse,
			"quantity":  5,
			"uom":       "pcs",
		})
		if err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "marshal error: %v", err)
			t.Fatalf("marshal wms payload: %v", err)
		}

		req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/stock/", bytes.NewReader(body))
		if err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "request error: %v", err)
			t.Fatalf("prepare wms upsert: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")

		recordArtifact(t, artifactsDir, "wms_stock.log", "upsert sku=%s warehouse=%s", sku, warehouse)
		resp, err := client.Do(req)
		if err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "request failed: %v", err)
			t.Fatalf("wms upsert request failed: %v", err)
		}
		defer resp.Body.Close()

		recordArtifact(t, artifactsDir, "wms_stock.log", "status=%d", resp.StatusCode)
		if resp.StatusCode != http.StatusCreated {
			data, _ := io.ReadAll(resp.Body)
			t.Fatalf("wms upsert status %d body %s", resp.StatusCode, string(data))
		}

		var created struct {
			SKU       string  `json:"sku"`
			Warehouse string  `json:"warehouse"`
			Quantity  float64 `json:"quantity"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "decode error: %v", err)
			t.Fatalf("decode wms upsert: %v", err)
		}
		recordArtifact(t, artifactsDir, "wms_stock.log", "created sku=%s warehouse=%s quantity=%.2f", created.SKU, created.Warehouse, created.Quantity)
		if created.SKU != sku || created.Warehouse != warehouse {
			t.Fatalf("unexpected wms response: %+v", created)
		}

		respList, err := client.Get(baseURL + "/api/v1/stock/?warehouse=" + warehouse)
		if err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "list error: %v", err)
			t.Fatalf("wms list request failed: %v", err)
		}
		defer respList.Body.Close()

		recordArtifact(t, artifactsDir, "wms_stock.log", "list status=%d", respList.StatusCode)
		if respList.StatusCode != http.StatusOK {
			t.Fatalf("wms list status: %d", respList.StatusCode)
		}

		var listPayload struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.NewDecoder(respList.Body).Decode(&listPayload); err != nil {
			recordArtifact(t, artifactsDir, "wms_stock.log", "list decode error: %v", err)
			t.Fatalf("decode wms list: %v", err)
		}
		recordArtifact(t, artifactsDir, "wms_stock.log", "items=%d", len(listPayload.Items))
		if len(listPayload.Items) == 0 {
			t.Fatalf("wms list is empty for %s", warehouse)
		}

	})

	t.Run("gateway_wms_catalog_crud", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		authHeader := smokeAuthHeader()
		const artifact = "gateway_wms_catalog.log"
		typeParam := "custom"
		code := fmt.Sprintf("GW-CAT-%d", time.Now().UnixNano())

		status, body := jsonRequestWithAuth(t, client, http.MethodPost,
			fmt.Sprintf("%s/api/v1/wms/catalog/%s", base, typeParam),
			map[string]any{"code": code, "name": "Gateway Catalog", "description": "created via gateway"},
			artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("gateway create catalog status %d body %s", status, string(body))
		}

		var created catalogNode
		if err := json.Unmarshal(body, &created); err != nil {
			t.Fatalf("decode gateway catalog: %v", err)
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet,
			fmt.Sprintf("%s/api/v1/wms/catalog/%s", base, typeParam), nil,
			artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway list catalog status %d", status)
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPut,
			fmt.Sprintf("%s/api/v1/wms/catalog/%s/%s", base, typeParam, created.ID),
			map[string]any{"name": "Gateway Catalog Updated"}, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway update catalog status %d body %s", status, string(body))
		}

		status, _ = jsonRequestWithAuth(t, client, http.MethodDelete,
			fmt.Sprintf("%s/api/v1/wms/catalog/%s/%s", base, typeParam, created.ID), nil,
			artifactsDir, artifact, authHeader)
		if status != http.StatusNoContent {
			t.Fatalf("gateway delete catalog status %d", status)
		}
	})

	t.Run("gateway_wms_warehouse_crud", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		authHeader := smokeAuthHeader()
		const artifact = "gateway_wms_warehouse.log"
		code := fmt.Sprintf("GW-WH-%d", time.Now().UnixNano())

		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/wms/warehouses",
			map[string]any{"code": code, "name": "Gateway Warehouse"}, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("gateway create warehouse status %d body %s", status, string(body))
		}

		var wh gatewayWarehouse
		if err := json.Unmarshal(body, &wh); err != nil {
			t.Fatalf("decode gateway warehouse: %v", err)
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPut,
			fmt.Sprintf("%s/api/v1/wms/warehouses/%s", base, wh.ID),
			map[string]any{"name": "Gateway Warehouse Updated", "status": "inactive"},
			artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway update warehouse status %d body %s", status, string(body))
		}

		status, _ = jsonRequestWithAuth(t, client, http.MethodDelete,
			fmt.Sprintf("%s/api/v1/wms/warehouses/%s", base, wh.ID), nil,
			artifactsDir, artifact, authHeader)
		if status != http.StatusNoContent {
			t.Fatalf("gateway delete warehouse status %d", status)
		}
	})

	t.Run("gateway_wms_stock_upsert", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		authHeader := smokeAuthHeader()
		const artifact = "gateway_wms_stock.log"

		payload := map[string]any{
			"sku":       fmt.Sprintf("GW-SKU-%d", time.Now().UnixNano()),
			"warehouse": "GW-WH-STOCK",
			"quantity":  18.5,
			"uom":       "pcs",
		}

		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/wms/stock", payload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("gateway stock upsert status %d body %s", status, string(body))
		}

		warehouse := payload["warehouse"].(string)
		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/wms/stock?warehouse="+url.QueryEscape(warehouse), nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("gateway stock list status %d", status)
		}

		var resp struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &resp); err != nil {
			t.Fatalf("decode gateway stock list: %v", err)
		}
		if len(resp.Items) == 0 {
			t.Fatalf("expected stock records in gateway list")
		}
	})

	t.Run("mes_minimal_api", func(t *testing.T) {
		artifact := "mes_api.log"
		authHeader := smokeAuthHeader()
		base := gatewayURL

		workCenterCode := fmt.Sprintf("MES-WC-%d", time.Now().UnixNano())
		workCenterPayload := map[string]any{
			"code":        workCenterCode,
			"name":        "Сборочный цех",
			"description": "Создано smoke-тестом",
		}

		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/mes/work-centers", workCenterPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create work center status %d body %s", status, string(body))
		}

		var wcResp map[string]any
		if err := json.Unmarshal(body, &wcResp); err != nil {
			t.Fatalf("decode work center: %v", err)
		}
		idVal, ok := wcResp["id"].(string)
		if !ok || idVal == "" {
			t.Fatalf("unexpected work center id: %v", wcResp["id"])
		}

		updateCenter := map[string]any{"description": "Обновлено smoke"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/mes/work-centers/%s", base, idVal), updateCenter, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update work center status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/mes/work-centers?limit=20", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list work centers status %d", status)
		}
		var centerList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &centerList); err != nil {
			t.Fatalf("decode work center list: %v", err)
		}
		foundCenter := false
		for _, item := range centerList.Items {
			if code, _ := item["code"].(string); code == workCenterCode {
				foundCenter = true
				break
			}
		}
		if !foundCenter {
			t.Fatalf("work center code %s not found in list", workCenterCode)
		}

		operationCode := fmt.Sprintf("MES-OP-%d", time.Now().UnixNano())
		opPayload := map[string]any{
			"code":                   operationCode,
			"name":                   "Резка металла",
			"description":            "Создано smoke",
			"defaultDurationMinutes": 15,
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/mes/operations", opPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create operation status %d body %s", status, string(body))
		}

		var opResp map[string]any
		if err := json.Unmarshal(body, &opResp); err != nil {
			t.Fatalf("decode operation: %v", err)
		}
		opID, ok := opResp["id"].(string)
		if !ok || opID == "" {
			t.Fatalf("unexpected operation id: %v", opResp["id"])
		}

		updateOp := map[string]any{"defaultDurationMinutes": 20}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/mes/operations/%s", base, opID), updateOp, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update operation status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/mes/operations?limit=10", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list operations status %d", status)
		}
		var opList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &opList); err != nil {
			t.Fatalf("decode operation list: %v", err)
		}
		foundOp := false
		for _, item := range opList.Items {
			if code, _ := item["code"].(string); code == operationCode {
				foundOp = true
				break
			}
		}
		if !foundOp {
			t.Fatalf("operation code %s not found in list", operationCode)
		}

		routeCode := fmt.Sprintf("MES-RT-%d", time.Now().UnixNano())
		routePayload := map[string]any{
			"code":        routeCode,
			"name":        "Маршрут вывески",
			"description": "Создано smoke",
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/mes/routes", routePayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create route status %d body %s", status, string(body))
		}

		var routeResp map[string]any
		if err := json.Unmarshal(body, &routeResp); err != nil {
			t.Fatalf("decode route: %v", err)
		}
		routeID, ok := routeResp["id"].(string)
		if !ok || routeID == "" {
			t.Fatalf("unexpected route id: %v", routeResp["id"])
		}

		updateRoute := map[string]any{"description": "Обновлено smoke"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/mes/routes/%s", base, routeID), updateRoute, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update route status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/mes/routes?limit=10", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list routes status %d", status)
		}
		var routeList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &routeList); err != nil {
			t.Fatalf("decode route list: %v", err)
		}
		foundRoute := false
		for _, item := range routeList.Items {
			if code, _ := item["code"].(string); code == routeCode {
				foundRoute = true
				break
			}
		}
		if !foundRoute {
			t.Fatalf("route code %s not found in list", routeCode)
		}
	})

	t.Run("montage_minimal_api", func(t *testing.T) {
		artifact := "montage_api.log"
		authHeader := smokeAuthHeader()
		base := gatewayURL

		crewCode := fmt.Sprintf("MNT-CR-%d", time.Now().UnixNano())
		crewPayload := map[string]any{
			"code":           crewCode,
			"name":           "Монтажная бригада №1",
			"specialization": "Высотные работы",
		}

		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/montage/crews", crewPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create crew status %d body %s", status, string(body))
		}

		var crewResp map[string]any
		if err := json.Unmarshal(body, &crewResp); err != nil {
			t.Fatalf("decode crew: %v", err)
		}
		crewID, ok := crewResp["id"].(string)
		if !ok || crewID == "" {
			t.Fatalf("unexpected crew id: %v", crewResp["id"])
		}

		updateCrew := map[string]any{"specialization": "Работы с рекламными конструкциями"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/montage/crews/%s", base, crewID), updateCrew, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update crew status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/montage/crews?limit=20", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list crews status %d", status)
		}
		var crewList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &crewList); err != nil {
			t.Fatalf("decode crew list: %v", err)
		}
		foundCrew := false
		for _, item := range crewList.Items {
			if code, _ := item["code"].(string); code == crewCode {
				foundCrew = true
				break
			}
		}
		if !foundCrew {
			t.Fatalf("crew code %s not found", crewCode)
		}

		vehicleCode := fmt.Sprintf("MNT-VEH-%d", time.Now().UnixNano())
		vehiclePayload := map[string]any{
			"code":     vehicleCode,
			"name":     "MAN TGE",
			"plate":    "A123BC77",
			"capacity": "2.5t",
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/montage/vehicles", vehiclePayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create vehicle status %d body %s", status, string(body))
		}

		var vehicleResp map[string]any
		if err := json.Unmarshal(body, &vehicleResp); err != nil {
			t.Fatalf("decode vehicle: %v", err)
		}
		vehicleID, ok := vehicleResp["id"].(string)
		if !ok || vehicleID == "" {
			t.Fatalf("unexpected vehicle id: %v", vehicleResp["id"])
		}

		updateVehicle := map[string]any{"plate": "B987CD99", "capacity": "3.0t"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/montage/vehicles/%s", base, vehicleID), updateVehicle, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update vehicle status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/montage/vehicles?limit=10", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list vehicles status %d", status)
		}
		var vehicleList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &vehicleList); err != nil {
			t.Fatalf("decode vehicle list: %v", err)
		}
		foundVehicle := false
		for _, item := range vehicleList.Items {
			if code, _ := item["code"].(string); code == vehicleCode {
				foundVehicle = true
				break
			}
		}
		if !foundVehicle {
			t.Fatalf("vehicle code %s not found", vehicleCode)
		}

		taskCode := fmt.Sprintf("MNT-TSK-%d", time.Now().UnixNano())
		start := time.Now().Add(2 * time.Hour).UTC().Format(time.RFC3339)
		taskPayload := map[string]any{
			"code":        taskCode,
			"title":       "Монтаж вывески в ТЦ",
			"crewId":      crewID,
			"vehicleId":   vehicleID,
			"scheduledAt": start,
			"location":    "Москва, Тверская 1",
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/montage/tasks", taskPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create task status %d body %s", status, string(body))
		}

		var taskResp map[string]any
		if err := json.Unmarshal(body, &taskResp); err != nil {
			t.Fatalf("decode task: %v", err)
		}
		taskID, ok := taskResp["id"].(string)
		if !ok || taskID == "" {
			t.Fatalf("unexpected task id: %v", taskResp["id"])
		}

		updateTask := map[string]any{"status": "in_progress", "location": "Москва, Арбат 12"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/montage/tasks/%s", base, taskID), updateTask, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update task status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/montage/tasks?limit=10", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list tasks status %d", status)
		}
		var taskList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &taskList); err != nil {
			t.Fatalf("decode task list: %v", err)
		}
		foundTask := false
		for _, item := range taskList.Items {
			if code, _ := item["code"].(string); code == taskCode {
				foundTask = true
				break
			}
		}
		if !foundTask {
			t.Fatalf("task code %s not found", taskCode)
		}
	})

	t.Run("docs_minimal_api", func(t *testing.T) {
		artifact := "docs_api.log"
		authHeader := smokeAuthHeader()
		base := gatewayURL

		tplCode := fmt.Sprintf("DOC-TPL-%d", time.Now().UnixNano())
		tplPayload := map[string]any{
			"code":        tplCode,
			"name":        "Документ по смоке",
			"description": "Smoke template",
			"body":        map[string]any{"fields": []string{"name"}},
		}

		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/docs/templates", tplPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create template status %d body %s", status, string(body))
		}

		var tplResp map[string]any
		if err := json.Unmarshal(body, &tplResp); err != nil {
			t.Fatalf("decode template: %v", err)
		}
		tplID, _ := tplResp["id"].(string)
		if tplID == "" {
			t.Fatalf("unexpected template id")
		}

		updateTpl := map[string]any{"name": "Документ обновлён"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/docs/templates/%s", base, tplID), updateTpl, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update template status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/docs/templates?limit=5", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list templates status %d", status)
		}
		var tplList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &tplList); err != nil {
			t.Fatalf("decode template list: %v", err)
		}
		foundTpl := false
		for _, item := range tplList.Items {
			if code, _ := item["code"].(string); code == tplCode {
				foundTpl = true
				break
			}
		}
		if !foundTpl {
			t.Fatalf("template %s not found", tplCode)
		}

		signerCode := fmt.Sprintf("DOC-SG-%d", time.Now().UnixNano())
		signerPayload := map[string]any{
			"code":     signerCode,
			"fullName": "Подписант Смоки",
			"email":    "smoke-docs@example.com",
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/docs/signers", signerPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create signer status %d body %s", status, string(body))
		}
		var signerResp map[string]any
		if err := json.Unmarshal(body, &signerResp); err != nil {
			t.Fatalf("decode signer: %v", err)
		}
		signerID, _ := signerResp["id"].(string)
		if signerID == "" {
			t.Fatalf("unexpected signer id")
		}

		docPayload := map[string]any{
			"templateId":   tplID,
			"sequenceCode": "DOC-OFFER",
			"title":        "Smoke Документ",
			"payload":      map[string]any{"customer": "ACME"},
			"signerIds":    []string{signerID},
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/docs/documents", docPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create document status %d body %s", status, string(body))
		}
		var docResp map[string]any
		if err := json.Unmarshal(body, &docResp); err != nil {
			t.Fatalf("decode document: %v", err)
		}
		docID, _ := docResp["id"].(string)
		if docID == "" {
			t.Fatalf("unexpected document id")
		}

		updateDoc := map[string]any{
			"status":  "signed",
			"signers": []map[string]any{{"signerId": signerID, "status": "signed"}},
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/docs/documents/%s", base, docID), updateDoc, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update document status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/docs/documents?status=signed", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list documents status %d", status)
		}
		var docList struct {
			Items []map[string]any `json:"items"`
		}
		if err := json.Unmarshal(body, &docList); err != nil {
			t.Fatalf("decode document list: %v", err)
		}
		foundDoc := false
		for _, item := range docList.Items {
			if id, _ := item["id"].(string); id == docID {
				foundDoc = true
				break
			}
		}
		if !foundDoc {
			t.Fatalf("document id %s not found", docID)
		}
	})

	t.Run("gateway_bpm_process_flow", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		artifact := "gateway_bpm.log"
		code := fmt.Sprintf("SMOKE-BPM-%d", time.Now().UnixNano())

		processPayload := map[string]any{
			"code":        code,
			"name":        "Smoke BPM Process",
			"description": "Smoke test process",
			"definition":  map[string]any{"steps": []string{"collect", "approve"}},
		}
		status, body := jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/bpm/processes", processPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create process status %d body %s", status, string(body))
		}
		var process struct {
			ID     string `json:"id"`
			Code   string `json:"code"`
			Status string `json:"status"`
		}
		if err := json.Unmarshal(body, &process); err != nil {
			t.Fatalf("decode process: %v", err)
		}
		if process.ID == "" {
			t.Fatalf("process id is empty")
		}

		updateProcess := map[string]any{"status": "published"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/bpm/processes/%s", base, process.ID), updateProcess, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update process status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/bpm/processes?limit=20", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list processes status %d", status)
		}
		var processList struct {
			Items []struct {
				ID   string `json:"id"`
				Code string `json:"code"`
			} `json:"items"`
		}
		if err := json.Unmarshal(body, &processList); err != nil {
			t.Fatalf("decode process list: %v", err)
		}
		foundProcess := false
		for _, item := range processList.Items {
			if item.ID == process.ID {
				foundProcess = true
				break
			}
		}
		if !foundProcess {
			t.Fatalf("process %s not found in list", process.ID)
		}

		formPayload := map[string]any{
			"processId": process.ID,
			"code":      code + "-FORM",
			"name":      "Smoke BPM Form",
			"schema":    map[string]any{"fields": []string{"comment"}},
			"uiSchema":  map[string]any{"layout": "single"},
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/bpm/forms", formPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create form status %d body %s", status, string(body))
		}
		var form struct {
			ID      string `json:"id"`
			Version int    `json:"version"`
		}
		if err := json.Unmarshal(body, &form); err != nil {
			t.Fatalf("decode form: %v", err)
		}
		if form.ID == "" {
			t.Fatalf("form id is empty")
		}

		updateForm := map[string]any{"version": form.Version + 1}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/bpm/forms/%s", base, form.ID), updateForm, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update form status %d body %s", status, string(body))
		}

		dueAt := time.Now().Add(2 * time.Hour).UTC().Format(time.RFC3339)
		taskPayload := map[string]any{
			"processId": process.ID,
			"code":      code + "-TASK",
			"title":     "Smoke BPM Task",
			"assignee":  "smoke-user",
			"dueAt":     dueAt,
			"payload":   map[string]any{"source": "smoke"},
		}
		status, body = jsonRequestWithAuth(t, client, http.MethodPost, base+"/api/v1/bpm/tasks", taskPayload, artifactsDir, artifact, authHeader)
		if status != http.StatusCreated {
			t.Fatalf("create task status %d body %s", status, string(body))
		}
		var task struct {
			ID     string `json:"id"`
			Status string `json:"status"`
		}
		if err := json.Unmarshal(body, &task); err != nil {
			t.Fatalf("decode task: %v", err)
		}
		if task.ID == "" {
			t.Fatalf("task id is empty")
		}

		completeTask := map[string]any{"status": "completed"}
		status, body = jsonRequestWithAuth(t, client, http.MethodPut, fmt.Sprintf("%s/api/v1/bpm/tasks/%s", base, task.ID), completeTask, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("update task status %d body %s", status, string(body))
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/bpm/tasks?status=completed&limit=20", nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("list tasks status %d", status)
		}
		var taskList struct {
			Items []struct {
				ID     string `json:"id"`
				Status string `json:"status"`
			} `json:"items"`
		}
		if err := json.Unmarshal(body, &taskList); err != nil {
			t.Fatalf("decode task list: %v", err)
		}
		foundTask := false
		for _, item := range taskList.Items {
			if item.ID == task.ID && strings.EqualFold(item.Status, "completed") {
				foundTask = true
				break
			}
		}
		if !foundTask {
			t.Fatalf("completed task %s not found", task.ID)
		}
	})

	t.Run("gateway_analytics_reports_exports", func(t *testing.T) {
		base := getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")
		authHeader := smokeAuthHeader()
		artifact := "gateway_analytics.log"

		from := time.Now().Add(-60 * 24 * time.Hour).UTC().Format(time.RFC3339)
		to := time.Now().Add(2 * time.Hour).UTC().Format(time.RFC3339)
		query := fmt.Sprintf("?from=%s&to=%s", from, to)

		status, body := jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/analytics/reports/conversion"+query, nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("conversion report status %d body %s", status, string(body))
		}
		var conversion struct {
			Items []struct {
				TotalCount int `json:"totalCount"`
				WonCount   int `json:"wonCount"`
			}
		}
		if err := json.Unmarshal(body, &conversion); err != nil {
			t.Fatalf("decode conversion: %v", err)
		}
		if len(conversion.Items) == 0 {
			t.Fatalf("conversion items empty")
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/analytics/reports/manager-load"+query, nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("manager load status %d body %s", status, string(body))
		}
		var managerLoad struct {
			Items []struct {
				Manager string `json:"manager"`
			}
		}
		if err := json.Unmarshal(body, &managerLoad); err != nil {
			t.Fatalf("decode manager load: %v", err)
		}
		if len(managerLoad.Items) == 0 {
			t.Fatalf("manager load items empty")
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/analytics/exports/conversion"+query, nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("conversion export status %d body %s", status, string(body))
		}
		var export struct {
			FileName      string `json:"fileName"`
			MimeType      string `json:"mimeType"`
			ContentBase64 string `json:"contentBase64"`
		}
		if err := json.Unmarshal(body, &export); err != nil {
			t.Fatalf("decode conversion export: %v", err)
		}
		if export.FileName == "" || export.MimeType == "" || export.ContentBase64 == "" {
			t.Fatalf("conversion export fields missing: %+v", export)
		}
		if _, err := base64.StdEncoding.DecodeString(export.ContentBase64); err != nil {
			t.Fatalf("conversion export decode: %v", err)
		}

		status, body = jsonRequestWithAuth(t, client, http.MethodGet, base+"/api/v1/analytics/exports/manager-load"+query, nil, artifactsDir, artifact, authHeader)
		if status != http.StatusOK {
			t.Fatalf("manager load export status %d body %s", status, string(body))
		}
		if err := json.Unmarshal(body, &export); err != nil {
			t.Fatalf("decode manager export: %v", err)
		}
		if export.FileName == "" || export.ContentBase64 == "" {
			t.Fatalf("manager export fields missing: %+v", export)
		}
		if _, err := base64.StdEncoding.DecodeString(export.ContentBase64); err != nil {
			t.Fatalf("manager export decode: %v", err)
		}
	})
}

type catalogNode struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

type catalogListResponse struct {
	Items []catalogNode `json:"items"`
}

type attributeTemplate struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

type attributeTemplateList struct {
	Items []attributeTemplate `json:"items"`
}

type itemSnapshot struct {
	ID   string `json:"id"`
	SKU  string `json:"sku"`
	Name string `json:"name"`
}

type itemListResponse struct {
	Items []itemSnapshot `json:"items"`
}

type gatewayWarehouse struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Status      string `json:"status"`
	Description string `json:"description"`
}

type gatewayCustomer struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type gatewayDeal struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	CustomerID string  `json:"customerId"`
	Stage      string  `json:"stage"`
	Amount     float64 `json:"amount"`
}

func listCatalogNodes(t *testing.T, client *http.Client, baseURL, catalogType, artifactsDir, artifact string) []catalogNode {
	status, body := jsonRequest(t, client, http.MethodGet, fmt.Sprintf("%s/api/v1/master-data/catalog/%s", baseURL, catalogType), nil, artifactsDir, artifact)
	if status != http.StatusOK {
		t.Fatalf("list catalog %s status: %d body %s", catalogType, status, string(body))
	}
	var payload catalogListResponse
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("decode catalog list: %v", err)
	}
	return payload.Items
}

func containsCatalogCode(nodes []catalogNode, code string) bool {
	for _, node := range nodes {
		if node.Code == code {
			return true
		}
	}
	return false
}

func getCatalogNodeByCode(t *testing.T, client *http.Client, baseURL, catalogType, code, artifactsDir, artifact string) catalogNode {
	nodes := listCatalogNodes(t, client, baseURL, catalogType, artifactsDir, artifact)
	for _, node := range nodes {
		if node.Code == code {
			return node
		}
	}
	return catalogNode{}
}

func listAttributeTemplates(t *testing.T, client *http.Client, baseURL, artifactsDir, artifact string) map[string]string {
	status, body := jsonRequest(t, client, http.MethodGet, fmt.Sprintf("%s/api/v1/master-data/attribute-templates", baseURL), nil, artifactsDir, artifact)
	if status != http.StatusOK {
		t.Fatalf("list attribute templates status: %d body %s", status, string(body))
	}
	var payload attributeTemplateList
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("decode attribute templates: %v", err)
	}
	result := make(map[string]string, len(payload.Items))
	for _, tpl := range payload.Items {
		result[tpl.Code] = tpl.ID
	}
	return result
}

func listItems(t *testing.T, client *http.Client, baseURL, artifactsDir, artifact string) []itemSnapshot {
	status, body := jsonRequest(t, client, http.MethodGet, fmt.Sprintf("%s/api/v1/master-data/items", baseURL), nil, artifactsDir, artifact)
	if status != http.StatusOK {
		t.Fatalf("list items status: %d body %s", status, string(body))
	}
	var payload itemListResponse
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("decode items list: %v", err)
	}
	return payload.Items
}

func containsItemSKU(items []itemSnapshot, sku string) bool {
	for _, item := range items {
		if item.SKU == sku {
			return true
		}
	}
	return false
}

func jsonRequest(t *testing.T, client *http.Client, method, url string, payload any, artifactsDir, artifact string) (int, []byte) {
	return jsonRequestWithAuth(t, client, method, url, payload, artifactsDir, artifact, "")
}

func jsonRequestWithAuth(t *testing.T, client *http.Client, method, url string, payload any, artifactsDir, artifact string, authHeader string) (int, []byte) {
	t.Helper()
	var bodyBytes []byte
	if payload != nil {
		var err error
		bodyBytes, err = json.Marshal(payload)
		if err != nil {
			t.Fatalf("marshal payload: %v", err)
		}
		recordArtifact(t, artifactsDir, artifact, "request=%s %s body=%s", method, url, string(bodyBytes))
	} else {
		recordArtifact(t, artifactsDir, artifact, "request=%s %s", method, url)
	}

	var reader io.Reader
	if len(bodyBytes) > 0 {
		reader = bytes.NewReader(bodyBytes)
	}

	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatalf("prepare request: %v", err)
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if strings.TrimSpace(authHeader) != "" {
		req.Header.Set("Authorization", authHeader)
	}

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read response: %v", err)
	}

	recordArtifact(t, artifactsDir, artifact, "status=%d", resp.StatusCode)
	if len(respBody) > 0 {
		recordArtifact(t, artifactsDir, artifact, "response=%s", string(respBody))
	}

	return resp.StatusCode, respBody
}

func uploadFile(t *testing.T, client *http.Client, baseURL, authHeader, folder, filename string, content []byte, artifactsDir, artifactFile string) uploadResponse {
	t.Helper()

	recordArtifact(t, artifactsDir, artifactFile, "prepare folder=%s filename=%s", folder, filename)

	buf := new(bytes.Buffer)
	writer := multipart.NewWriter(buf)

	fw, err := writer.CreateFormFile("file", filename)
	if err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "form error: %v", err)
		t.Fatalf("create form file: %v", err)
	}

	if _, err := fw.Write(content); err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "payload error: %v", err)
		t.Fatalf("write payload: %v", err)
	}

	if err := writer.WriteField("folder", folder); err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "folder error: %v", err)
		t.Fatalf("write folder field: %v", err)
	}

	if err := writer.Close(); err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "close error: %v", err)
		t.Fatalf("close writer: %v", err)
	}

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/files", buf)
	if err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "request error: %v", err)
		t.Fatalf("prepare request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", authHeader)

	recordArtifact(t, artifactsDir, artifactFile, "request prepared auth=set")
	resp, err := client.Do(req)
	if err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "request failed: %v", err)
		t.Fatalf("upload request: %v", err)
	}
	defer resp.Body.Close()

	recordArtifact(t, artifactsDir, artifactFile, "status=%d", resp.StatusCode)
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		recordArtifact(t, artifactsDir, artifactFile, "error body=%s", string(body))
		t.Fatalf("unexpected status %d body %s", resp.StatusCode, string(body))
	}

	var payload uploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		recordArtifact(t, artifactsDir, artifactFile, "decode error: %v", err)
		t.Fatalf("decode response: %v", err)
	}

	recordArtifact(t, artifactsDir, artifactFile, "url=%s version=%s", payload.URL, payload.Version)
	return payload
}

func ensureArtifactsDir(t *testing.T) string {
	dir := os.Getenv("SMOKE_ARTIFACTS_DIR")
	if dir == "" {
		dir = filepath.Join("tests", "smoke", "artifacts")
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("create artifacts dir: %v", err)
	}
	return dir
}

func recordArtifact(t *testing.T, dir, name, format string, args ...any) {
	t.Helper()
	if dir == "" {
		return
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Logf("record artifact mkdir %s: %v", dir, err)
		return
	}
	file := filepath.Join(dir, name)
	f, err := os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		t.Logf("record artifact open %s: %v", file, err)
		return
	}
	defer func() { _ = f.Close() }()
	if _, err := fmt.Fprintf(f, format+"\n", args...); err != nil {
		t.Logf("record artifact write %s: %v", file, err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func smokeAuthHeader() string {
	if v := os.Getenv("SMOKE_GATEWAY_BASIC_AUTH"); v != "" {
		v = strings.TrimSpace(v)
		if strings.HasPrefix(strings.ToLower(v), "basic ") {
			return v
		}
		return "Basic " + base64.StdEncoding.EncodeToString([]byte(v))
	}
	user := getenv("SMOKE_GATEWAY_USER", "admin@example.com")
	pass := getenv("SMOKE_GATEWAY_PASSWORD", "admin123")
	return "Basic " + base64.StdEncoding.EncodeToString([]byte(user+":"+pass))
}
