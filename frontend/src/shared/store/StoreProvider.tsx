import { ReactNode } from 'react';
import { CoursesProvider } from './courseStore';
import { AssignmentsProvider } from './assignmentStore';
import { GradesProvider } from './gradeStore';
import { UsersProvider } from './userStore';
import { LogsProvider, EventsProvider } from './logsAndEventsStore';

interface StoreProviderProps {
  children: ReactNode;
}

/**
 * Корневой провайдер для всех хранилищ данных в приложении
 */
const StoreProvider = ({ children }: StoreProviderProps) => {
  return (
    <UsersProvider>
      <CoursesProvider>
        <AssignmentsProvider>
          <GradesProvider>
            <LogsProvider>
              <EventsProvider>
                {children}
              </EventsProvider>
            </LogsProvider>
          </GradesProvider>
        </AssignmentsProvider>
      </CoursesProvider>
    </UsersProvider>
  );
};

export default StoreProvider;
