package s3

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/url"
	"path"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// Client wraps MinIO SDK to work with Ceph RGW.
type Client struct {
	client *minio.Client
	bucket string
}

// New creates an S3 client.
func New(endpoint, region, accessKey, secretKey, bucket string, useSSL bool) (*Client, error) {
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return nil, fmt.Errorf("parse endpoint: %w", err)
	}

	client, err := minio.New(parsed.Host, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: region,
	})
	if err != nil {
		return nil, fmt.Errorf("create s3 client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("ensure bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{Region: region}); err != nil {
			return nil, fmt.Errorf("create bucket: %w", err)
		}
	}

	return &Client{client: client, bucket: bucket}, nil
}

// Upload stores incoming file stream and returns object path and version ID.
func (c *Client) Upload(ctx context.Context, folder, filename string, r io.Reader, size int64, contentType string) (string, string, error) {
	objectName := path.Join(folder, filename)

	info, err := c.client.PutObject(ctx, c.bucket, objectName, r, size, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", "", fmt.Errorf("put object: %w", err)
	}

	fileURL := c.client.EndpointURL()
	fileURL.Path = path.Join(fileURL.Path, c.bucket, objectName)

	return fileURL.String(), info.VersionID, nil
}

// UploadBytes helper to upload arbitrary content.
func (c *Client) UploadBytes(ctx context.Context, folder, filename string, data []byte, contentType string) (string, string, error) {
	reader := bytes.NewReader(data)
	return c.Upload(ctx, folder, filename, reader, int64(len(data)), contentType)
}
