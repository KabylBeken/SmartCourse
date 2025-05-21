import React from 'react';
import { Link } from 'react-router-dom';
import type { Assignment } from '@/shared/api/types';
import Button from '@/shared/ui/Button';

interface AssignmentCardProps {
  assignment: Assignment;
  className?: string;
  actionButton?: React.ReactNode;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, className = '', actionButton }) => {
  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Определение статуса задания
  const getStatusBadge = () => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now;

    if (isOverdue) {
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Просрочено</span>;
    }

    // Проверка, если до срока сдачи осталось меньше 3 дней
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const isAlmostDue = dueDate.getTime() - now.getTime() < threeDaysInMs;

    if (isAlmostDue) {
      return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Скоро срок</span>;
    }

    return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Активно</span>;
  };

  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          {assignment.description}
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Курс:</span> {assignment.courseTitle}
          </div>
          <div>
            <span className="font-medium">Макс. оценка:</span> {assignment.maxScore}
          </div>
          <div>
            <span className="font-medium">Дата назначения:</span> {formatDate(assignment.assignedDate)}
          </div>
          <div>
            <span className="font-medium">Срок сдачи:</span> {formatDate(assignment.dueDate)}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {actionButton ? (
            actionButton
          ) : (
            <Link to={`/assignments/${assignment.id}`}>
              <Button variant="primary" size="sm">
                Открыть задание
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;
