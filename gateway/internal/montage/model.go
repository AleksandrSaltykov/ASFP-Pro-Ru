package montage

import (
	"time"

	"github.com/google/uuid"
)

// Crew представляет бригаду для gateway.
type Crew struct {
	ID             uuid.UUID `json:"id"`
	Code           string    `json:"code"`
	Name           string    `json:"name"`
	Specialization string    `json:"specialization"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CreateCrewInput входные данные для создания бригады.
type CreateCrewInput struct {
	Code           string
	Name           string
	Specialization string
}

// UpdateCrewInput перечисляет обновляемые поля бригады.
type UpdateCrewInput struct {
	Name           *string
	Specialization *string
}

// Vehicle представляет транспорт.
type Vehicle struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Plate     string    `json:"plate"`
	Capacity  string    `json:"capacity"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateVehicleInput входные данные для транспорта.
type CreateVehicleInput struct {
	Code     string
	Name     string
	Plate    string
	Capacity string
}

// UpdateVehicleInput перечисляет обновляемые поля транспорта.
type UpdateVehicleInput struct {
	Name     *string
	Plate    *string
	Capacity *string
}

// Task описывает монтажную задачу.
type Task struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	CrewID      string    `json:"crewId"`
	VehicleID   string    `json:"vehicleId"`
	ScheduledAt time.Time `json:"scheduledAt"`
	Location    string    `json:"location"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateTaskInput входные данные для задачи.
type CreateTaskInput struct {
	Code        string
	Title       string
	CrewID      string
	VehicleID   string
	ScheduledAt string
	Location    string
}

// UpdateTaskInput перечисляет обновляемые поля задачи.
type UpdateTaskInput struct {
	Title       *string
	Status      *string
	CrewID      *string
	VehicleID   *string
	ScheduledAt *string
	Location    *string
}
