package identifier

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// build assembles identifier in PREFIX-<base36 timestamp><random> format.
func build(prefix string) string {
	prefix = strings.ToUpper(strings.TrimSpace(prefix))
	if prefix == "" {
		prefix = "ID"
	}

	ts := strings.ToUpper(strconv.FormatInt(time.Now().UnixNano(), 36))

	randomBytes := make([]byte, 4)
	if _, err := rand.Read(randomBytes); err != nil {
		// Fallback to timestamp-derived bytes if crypto/rand is unavailable.
		randomBytes = []byte(fmt.Sprintf("%08x", time.Now().UnixNano()))
	}
	randomHex := strings.ToUpper(hex.EncodeToString(randomBytes))
	if len(randomHex) > 6 {
		randomHex = randomHex[:6]
	}

	return fmt.Sprintf("%s-%s%s", prefix, ts, randomHex)
}

// SKU returns a generated stock keeping unit identifier.
func SKU() string {
	return build("SKU")
}

// CategoryCode returns generated catalog category code.
func CategoryCode() string {
	return build("GRP")
}

// UnitCode returns generated unit code.
func UnitCode() string {
	return build("UNT")
}

// WarehouseCode returns generated warehouse code.
func WarehouseCode() string {
	return build("WH")
}

// WithPrefix generates code using provided prefix.
func WithPrefix(prefix string) string {
	return build(prefix)
}
