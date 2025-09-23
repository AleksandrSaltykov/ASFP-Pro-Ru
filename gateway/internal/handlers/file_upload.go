// Package handlers exposes REST handlers for the gateway.
package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"

	"asfppro/pkg/s3"
)

// FileUploadHandler handles file uploads to Ceph RGW.
func FileUploadHandler(client *s3.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		fileHeader, err := c.FormFile("file")
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "file is required")
		}

		file, err := fileHeader.Open()
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "cannot open file")
		}
		defer func() { _ = file.Close() }()

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		folder := c.FormValue("folder", "uploads")
		url, version, err := client.Upload(ctx, folder, fileHeader.Filename, file, fileHeader.Size, fileHeader.Header.Get("Content-Type"))
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("upload failed: %v", err))
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"url":     url,
			"version": version,
		})
	}
}
