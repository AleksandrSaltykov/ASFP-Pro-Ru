package smoke

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

type service struct {
	name string
	url  string
}

func TestSmokeEndpoints(t *testing.T) {
	services := []service{
		{name: "gateway", url: getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")},
		{name: "crm", url: getenv("SMOKE_CRM_URL", "http://localhost:8081")},
		{name: "wms", url: getenv("SMOKE_WMS_URL", "http://localhost:8082")},
	}

	authHeader := smokeAuthHeader()
	client := &http.Client{Timeout: 5 * time.Second}

	for _, svc := range services {
		svc := svc
		t.Run(svc.name+"_health", func(t *testing.T) {
			resp, err := client.Get(svc.url + "/health")
			if err != nil {
				t.Fatalf("%s health request failed: %v", svc.name, err)
			}
			t.Cleanup(func() { _ = resp.Body.Close() })

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
				t.Fatalf("%s openapi request failed: %v", svc.name, err)
			}
			t.Cleanup(func() { _ = resp.Body.Close() })

			if resp.StatusCode != http.StatusOK {
				t.Fatalf("%s openapi status: %d", svc.name, resp.StatusCode)
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatalf("read openapi body: %v", err)
			}
			if len(body) == 0 {
				t.Fatalf("%s openapi body is empty", svc.name)
			}
			if ct := resp.Header.Get("Content-Type"); ct != "" && !strings.Contains(ct, "json") {
				t.Fatalf("%s openapi content-type unexpected: %s", svc.name, ct)
			}
		})
	}

	t.Run("gateway_file_upload", func(t *testing.T) {
		buf := new(bytes.Buffer)
		writer := multipart.NewWriter(buf)

		fw, err := writer.CreateFormFile("file", "smoke.txt")
		if err != nil {
			t.Fatalf("create form file: %v", err)
		}

		content := []byte("smoke-test")
		if _, err := fw.Write(content); err != nil {
			t.Fatalf("write payload: %v", err)
		}

		if err := writer.WriteField("folder", "smoke"); err != nil {
			t.Fatalf("write folder field: %v", err)
		}

		if err := writer.Close(); err != nil {
			t.Fatalf("close writer: %v", err)
		}

		req, err := http.NewRequest(http.MethodPost, getenv("SMOKE_GATEWAY_URL", "http://localhost:8080")+"/api/v1/files", buf)
		if err != nil {
			t.Fatalf("prepare request: %v", err)
		}
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", authHeader)

		resp, err := client.Do(req)
		if err != nil {
			t.Fatalf("upload request: %v", err)
		}
		t.Cleanup(func() { _ = resp.Body.Close() })

		if resp.StatusCode != http.StatusCreated {
			body, _ := io.ReadAll(resp.Body)
			t.Fatalf("unexpected status %d body %s", resp.StatusCode, string(body))
		}

		var payload struct {
			URL     string `json:"url"`
			Version string `json:"version"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
			t.Fatalf("decode response: %v", err)
		}

		if payload.URL == "" {
			t.Fatalf("empty URL in response")
		}
	})
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
