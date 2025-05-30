import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/shared/ui/Button';

// Расширенный интерфейс для карточки курса
interface CourseCardData {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  duration?: string;
}

interface CourseCardProps {
  course: CourseCardData;
  className?: string;
  actionButton?: React.ReactNode;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = '', actionButton }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 h-full flex flex-col ${className}`}>
      {course.imageUrl && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={course.imageUrl} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
        
        <div className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
          {course.description}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          {course.category && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {course.category}
            </span>
          )}
          
          {course.duration && (
            <span className="text-xs text-gray-500">
              Длительность: {course.duration}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          {actionButton ? (
            actionButton
          ) : (
            <Link to={`/courses/${course.id}`} className="w-full">
              <Button variant="primary" size="sm" fullWidth>
                Подробнее
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
