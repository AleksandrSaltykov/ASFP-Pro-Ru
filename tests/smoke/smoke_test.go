package smoke

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
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
		resp, err := client.Get(getenv("SMOKE_CRM_URL", "http://localhost:8081") + "/api/v1/deals/")
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
			Items []map[string]any `json:"items"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			recordArtifact(t, artifactsDir, "crm_deals.log", "decode error: %v", err)
			t.Fatalf("decode crm list: %v", err)
		}
		recordArtifact(t, artifactsDir, "crm_deals.log", "items=%d", len(payload.Items))
		if len(payload.Items) > 0 {
			if title, ok := payload.Items[0]["title"]; ok {
				recordArtifact(t, artifactsDir, "crm_deals.log", "first_title=%v", title)
			}
		}
		if len(payload.Items) == 0 {
			t.Fatalf("crm deals list is empty")
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
