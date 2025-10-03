package entity

import "time"

// Crew описывает монтажную бригаду.
type Crew struct {
	ID             string    `json:"id"`
	Code           string    `json:"code"`
	Name           string    `json:"name"`
	Specialization string    `json:"specialization"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CrewCreateInput входные данные для создания бригады.
type CrewCreateInput struct {
	Code           string `json:"code"`
	Name           string `json:"name"`
	Specialization string `json:"specialization"`
}

// CrewUpdateInput перечисляет изменяемые поля бригады.
type CrewUpdateInput struct {
	Name           *string `json:"name"`
	Specialization *string `json:"specialization"`
}

// Vehicle описывает транспорт.
type Vehicle struct {
	ID        string    `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	Plate     string    `json:"plate"`
	Capacity  string    `json:"capacity"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// VehicleCreateInput входные данные для создания транспорта.
type VehicleCreateInput struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	Plate    string `json:"plate"`
	Capacity string `json:"capacity"`
}

// VehicleUpdateInput перечисляет изменяемые поля транспорта.
type VehicleUpdateInput struct {
	Name     *string `json:"name"`
	Plate    *string `json:"plate"`
	Capacity *string `json:"capacity"`
}

// Task описывает монтажную задачу.
type Task struct {
	ID          string    `json:"id"`
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

// TaskCreateInput входные данные для создания задачи.
type TaskCreateInput struct {
	Code        string `json:"code"`
	Title       string `json:"title"`
	CrewID      string `json:"crewId"`
	VehicleID   string `json:"vehicleId"`
	ScheduledAt string `json:"scheduledAt"`
	Location    string `json:"location"`
}

// TaskUpdateInput перечисляет изменяемые поля задачи.
type TaskUpdateInput struct {
	Title       *string `json:"title"`
	Status      *string `json:"status"`
	CrewID      *string `json:"crewId"`
	VehicleID   *string `json:"vehicleId"`
	ScheduledAt *string `json:"scheduledAt"`
	Location    *string `json:"location"`
}

// ListFilter переиспользуемый фильтр по лимиту.
type ListFilter struct {
	Limit int
}
