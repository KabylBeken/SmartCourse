package models

type Student struct {
	Id        int    `json:"id" gorm:"primaryKey"`
	FullName  string `json:"fullName" gorm:"column:full_name"`
	Birthdate string `json:"birthdate" gorm:"column:birthdate"`
	Age       int    `json:"age" gorm:"column:age"`
}

// TableName указывает имя таблицы
func (Student) TableName() string {
	return "students"
}
