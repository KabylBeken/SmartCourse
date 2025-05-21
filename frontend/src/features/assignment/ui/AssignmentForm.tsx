import React, { useState, useEffect } from 'react';
import type { Assignment, Course } from '@/shared/api/types';
import Input from '@/shared/ui/Input';
import TextArea from '@/shared/ui/TextArea';
import Select from '@/shared/ui/Select';
import Button from '@/shared/ui/Button';

interface AssignmentFormProps {
  initialData?: Partial<Assignment>;
  courses: Course[];
  onSubmit: (data: Partial<Assignment>) => void;
  loading?: boolean;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  initialData = {},
  courses,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Assignment>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Обновляем форму при изменении initialData
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Название задания обязательно';
    }
    
    if (!formData.courseId) {
      newErrors.courseId = 'Выберите курс';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Укажите срок сдачи';
    }
    
    if (formData.maxScore === undefined || formData.maxScore < 1) {
      newErrors.maxScore = 'Максимальная оценка должна быть положительным числом';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название задания"
        name="title"
        value={formData.title || ''}
        onChange={handleChange}
        error={errors.title}
        placeholder="Введите название задания"
        fullWidth
        required
      />

      <TextArea
        label="Описание"
        name="description"
        value={formData.description || ''}
        onChange={handleChange}
        error={errors.description}
        placeholder="Введите описание задания"
        rows={4}
        fullWidth
      />

      <Select
        label="Курс"
        name="courseId"
        value={formData.courseId?.toString() || ''}
        onChange={handleSelectChange('courseId')}
        options={courses.map(course => ({
          value: course.id.toString(),
          label: course.title
        }))}
        error={errors.courseId}
        fullWidth
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Максимальная оценка"
          name="maxScore"
          value={formData.maxScore?.toString() || ''}
          onChange={handleChange}
          error={errors.maxScore}
          placeholder="100"
          min="1"
          fullWidth
          required
        />

        <Input
          type="date"
          label="Срок сдачи"
          name="dueDate"
          value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
          onChange={handleChange}
          error={errors.dueDate}
          fullWidth
          required
        />
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {initialData.id ? 'Сохранить изменения' : 'Создать задание'}
        </Button>
      </div>
    </form>
  );
};

export default AssignmentForm;
