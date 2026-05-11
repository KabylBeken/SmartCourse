package delivery

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"rest-project/internal/db"
	"rest-project/internal/services/pdfgen"
)

type PDFHandler struct{}

func NewPDFHandler() *PDFHandler { return &PDFHandler{} }

// CourseReport — GET /api/teacher/courses/:id/report.pdf
func (h *PDFHandler) CourseReport(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid course id"})
		return
	}

	uid, _ := c.Get("user_id")
	teacherID, _ := uid.(uint)
	username, _ := c.Get("username")
	teacherName, _ := username.(string)

	gdb := db.DB

	// Метаданные курса
	var course struct {
		ID    uint
		Title string
	}
	if err := gdb.Table("courses").
		Select("id, title").
		Where("id = ? AND teacher_id = ? AND deleted_at IS NULL", courseID, teacherID).
		Scan(&course).Error; err != nil || course.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}

	// Сводка: студенты + средний балл
	var summary struct {
		StudentsCount int64
		AvgScore      float64
	}
	gdb.Table("course_students").
		Select("COUNT(DISTINCT user_id)").
		Where("course_id = ?", courseID).
		Scan(&summary.StudentsCount)

	gdb.Table("grades g").
		Select("COALESCE(AVG(g.score), 0)").
		Joins("JOIN assignments a ON a.id = g.assignment_id").
		Where("a.course_id = ? AND g.deleted_at IS NULL", courseID).
		Scan(&summary.AvgScore)

	// Строки таблицы — оценки по курсу
	type rowRaw struct {
		StudentName     string
		AssignmentTitle string
		Score           float64
		MaxScore        float64
		UpdatedAt       time.Time
	}
	var raws []rowRaw
	gdb.Table("grades g").
		Select("u.username AS student_name, a.title AS assignment_title, g.score, a.max_score, g.updated_at").
		Joins("JOIN users u ON u.id = g.student_id").
		Joins("JOIN assignments a ON a.id = g.assignment_id").
		Where("a.course_id = ? AND g.deleted_at IS NULL", courseID).
		Order("g.updated_at DESC").
		Limit(200).
		Scan(&raws)

	rows := make([]pdfgen.CourseReportRow, 0, len(raws))
	for _, r := range raws {
		rows = append(rows, pdfgen.CourseReportRow{
			StudentName:     r.StudentName,
			AssignmentTitle: r.AssignmentTitle,
			Score:           r.Score,
			MaxScore:        r.MaxScore,
			GradedAt:        r.UpdatedAt,
		})
	}

	pdfBytes, err := pdfgen.BuildCourseReportPDF(pdfgen.CourseReport{
		CourseTitle:   course.Title,
		TeacherName:   teacherName,
		GeneratedAt:   time.Now(),
		StudentsCount: int(summary.StudentsCount),
		AvgScore:      summary.AvgScore,
		Rows:          rows,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	filename := "course_" + strconv.FormatUint(courseID, 10) + "_report.pdf"
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
