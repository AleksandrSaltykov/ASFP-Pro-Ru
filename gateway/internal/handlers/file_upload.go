// Package handlers exposes REST handlers for the gateway.
package handlers

import (
	"context"
	"fmt"
	"path"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"

	"asfppro/pkg/audit"
	"asfppro/pkg/s3"
)

// FileUploadHandler handles file uploads to Ceph RGW.
func FileUploadHandler(client *s3.Client, recorder *audit.Recorder, logger zerolog.Logger) fiber.Handler {
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
		objectKey := path.Join(folder, fileHeader.Filename)

		url, version, err := client.Upload(ctx, folder, fileHeader.Filename, file, fileHeader.Size, fileHeader.Header.Get("Content-Type"))
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("upload failed: %v", err))
		}

		if recorder != nil {
			if user, ok := currentUser(c); ok {
				payload := map[string]any{
					"filename":    fileHeader.Filename,
					"folder":      folder,
					"size":        fileHeader.Size,
					"contentType": fileHeader.Header.Get("Content-Type"),
					"url":         url,
					"version":     version,
				}
				if err := recorder.Record(ctx, audit.Entry{
					ActorID:  user.ID,
					Action:   "gateway.file.upload",
					Entity:   "gateway.file",
					EntityID: objectKey,
					Payload:  payload,
				}); err != nil {
					logger.Error().Err(err).Msg("audit file upload")
				}
			}
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"url":     url,
			"version": version,
		})
	}
}
