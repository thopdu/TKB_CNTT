import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  selectedClass: string;
  setSelectedClass: (cls: string) => void;
  selectedLecturerId: string;
  setSelectedLecturerId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  switchRole: (role: UserRole) => void;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginTargetRole: UserRole | null;
  setLoginTargetRole: (role: UserRole | null) => void;
  isRoleLandingOpen: boolean;
  setIsRoleLandingOpen: (open: boolean) => void;
  isAIDrawerOpen: boolean;
  setIsAIDrawerOpen: (open: boolean) => void;
  switchUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pdu_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('pdu_role') as UserRole;
    return savedRole || 'STUDENT';
  });

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('pdu_student_class') || 'CNTT22A';
  });

  const [selectedLecturerId, setSelectedLecturerId] = useState<string>(() => {
    return localStorage.getItem('pdu_lecturer_id') || 'gv_003';
  });

  const [activeTab, setActiveTab] = useState<string>('timetable');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginTargetRole, setLoginTargetRole] = useState<UserRole | null>(null);
  const [isRoleLandingOpen, setIsRoleLandingOpen] = useState<boolean>(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('pdu_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('pdu_student_class', selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    localStorage.setItem('pdu_lecturer_id', selectedLecturerId);
  }, [selectedLecturerId]);

  const switchRole = (role: UserRole) => {
    if (role === 'ADMIN') {
      if (!currentUser || currentUser.role !== 'ADMIN') {
        // Require Admin login
        setLoginTargetRole('ADMIN');
        setIsLoginModalOpen(true);
        return;
      }
    } else if (role === 'MANAGER') {
      if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
        // Require Manager login
        setLoginTargetRole('MANAGER');
        setIsLoginModalOpen(true);
        return;
      }
    }

    setCurrentRole(role);
    setIsRoleLandingOpen(false);
    if (role === 'STUDENT' || role === 'LECTURER') {
      setActiveTab('timetable');
    } else if (role === 'MANAGER') {
      setActiveTab('manager_dashboard');
    } else if (role === 'ADMIN') {
      setActiveTab('data_sources');
    }
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setCurrentRole(res.user.role);
        localStorage.setItem('pdu_user', JSON.stringify(res.user));
        localStorage.setItem('pdu_role', res.user.role);
        setIsLoginModalOpen(false);
        setIsRoleLandingOpen(false);
        setLoginTargetRole(null);

        if (res.user.role === 'ADMIN') {
          setActiveTab('data_sources');
        } else if (res.user.role === 'MANAGER') {
          setActiveTab('manager_dashboard');
        } else if (res.user.role === 'LECTURER') {
          setActiveTab('timetable');
          if (res.user.entityId) setSelectedLecturerId(res.user.entityId);
        } else {
          setActiveTab('timetable');
          if (res.user.entityId) setSelectedClass(res.user.entityId);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pdu_user');
    setCurrentRole('STUDENT');
    setActiveTab('timetable');
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('pdu_user', JSON.stringify(user));
    localStorage.setItem('pdu_role', user.role);
    if (user.entityId) {
      if (user.role === 'LECTURER') setSelectedLecturerId(user.entityId);
      if (user.role === 'STUDENT') setSelectedClass(user.entityId);
    }
    if (user.role === 'STUDENT' || user.role === 'LECTURER') {
      setActiveTab('timetable');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: !!currentUser,
        selectedClass,
        setSelectedClass,
        selectedLecturerId,
        setSelectedLecturerId,
        activeTab,
        setActiveTab,
        switchRole,
        login,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginTargetRole,
        setLoginTargetRole,
        isRoleLandingOpen,
        setIsRoleLandingOpen,
        isAIDrawerOpen,
        setIsAIDrawerOpen,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
