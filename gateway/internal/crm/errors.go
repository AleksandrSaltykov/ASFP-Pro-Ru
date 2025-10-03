package crm

import "errors"

var (
	ErrCustomerNotFound = errors.New("customer not found")
	ErrDealNotFound     = errors.New("deal not found")
	ErrForbidden        = errors.New("crm: forbidden")
)
