package models

import (
    "database/sql/driver"
    "time"
)

type Prompt struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	TeacherID   uint           `json:"teacher_id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	PromptText  string         `gorm:"not null" json:"prompt_text"`
	Category    string         `gorm:"not null" json:"category"`
	IsPublic    bool           `gorm:"not null;default:false" json:"is_public"`
	IsFavorite  bool           `gorm:"not null;default:false" json:"is_favorite"`
	UseCount    int            `gorm:"not null;default:0" json:"use_count"`
	Tags        pqStringArray  `gorm:"type:text[];default:'{}'" json:"tags"`
	Collection  *string        `json:"collection"`
	IsTemplate  bool           `gorm:"not null;default:false" json:"is_template"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type PromptVersion struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	PromptID   uint      `json:"prompt_id"`
	Version    int       `json:"version"`
	Title      string    `json:"title"`
	Description string   `json:"description"`
	PromptText string    `json:"prompt_text"`
	Category   string    `json:"category"`
	Tags       pqStringArray `gorm:"type:text[];default:'{}'" json:"tags"`
	CreatedAt  time.Time `json:"created_at"`
}

// pqStringArray для text[] полей
// Реализация Scanner/Valuer для GORM

type pqStringArray []string

func (a *pqStringArray) Scan(src interface{}) error {
	switch v := src.(type) {
	case []byte:
		// '{a,b}' -> ["a","b"] простая обработка
		s := string(v)
		s = trimBraces(s)
		if s == "" {
			*a = []string{}
			return nil
		}
		*a = splitCSV(s)
		return nil
	case string:
		s := trimBraces(v)
		if s == "" {
			*a = []string{}
			return nil
		}
		*a = splitCSV(s)
		return nil
	default:
		*a = []string{}
		return nil
	}
}

func (a pqStringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "{}", nil
	}
	res := "{"
	for i, s := range a {
		if i > 0 { res += "," }
		res += quoteIfNeeded(s)
	}
	res += "}"
	return res, nil
}

func trimBraces(s string) string {
	if len(s) >= 2 && s[0] == '{' && s[len(s)-1] == '}' {
		return s[1:len(s)-1]
	}
	return s
}

func splitCSV(s string) []string {
	if s == "" { return []string{} }
	var out []string
	cur := ""
	inQuotes := false
	for _, r := range s {
		switch r {
		case '"':
			inQuotes = !inQuotes
		case ',':
			if inQuotes { cur += string(r) } else { out = append(out, cur); cur = "" }
		default:
			cur += string(r)
		}
	}
	out = append(out, cur)
	for i := range out { if len(out[i]) >= 2 && out[i][0] == '"' && out[i][len(out[i])-1] == '"' { out[i] = out[i][1:len(out[i])-1] } }
	return out
}

func quoteIfNeeded(s string) string {
	if s == "" { return "\"\"" }
	for _, r := range s {
		if r == ',' || r == ' ' { return "\"" + s + "\"" }
	}
	return s
}
