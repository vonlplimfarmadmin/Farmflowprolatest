import React, { useCallback } from 'react';
import { UserAccount, UserRole, UserStatus, SystemLog } from '../../types';
import {
  PasswordStrengthResult,
  generateSalt,
  hashPasswordWithSalt,
  hashSecurityAnswer,
  verifyPassword,
  constantTimeCompare,
  evaluatePasswordStrength,
  isAccountLocked,
} from '../../utils/security';
import { sanitizeText } from '../../utils/sanitizer';
import { fetchDocFromMongoDB, pullAllDataFromMongoDB } from '../../services/mongodbSync';
import { deduplicateUsers } from '../../domain/collectionUtils';

const loginAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

function checkDeviceRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number
): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const entry = loginAttemptsMap.get(key);
  if (entry && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  if (!entry || now - (entry.lockedUntil - lockoutMs) > windowMs) {
    loginAttemptsMap.set(key, { count: 1, lockedUntil: 0 });
    return { allowed: true, remainingSeconds: 0 };
  }
  entry.count += 1;
  if (entry.count >= maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    return {
      allowed: false,
      remainingSeconds: Math.ceil(lockoutMs / 1000),
    };
  }
  return { allowed: true, remainingSeconds: 0 };
}

function resetDeviceRateLimit(key: string): void {
  loginAttemptsMap.delete(key);
}

interface UseAuthDomainParams {
  currentUser: UserAccount | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  syncUserToBackend: (user: UserAccount) => void;
  deleteDocFromFirestore: (collectionName: string, docId: string) => void;
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
}

export function useAuthDomain({
  currentUser,
  setCurrentUser,
  users,
  setUsers,
  syncUserToBackend,
  deleteDocFromFirestore,
  logAction,
}: UseAuthDomainParams) {
  const login = useCallback(
    async (
      identifier: string,
      password?: string
    ): Promise<{
      success: boolean;
      message: string;
      user?: UserAccount;
      lockedOut?: boolean;
      remainingMinutes?: number;
      lockedRemainingSeconds?: number;
    }> => {
      const cleanId = sanitizeText(identifier, 100).toLowerCase();

      if (!cleanId) {
        return { success: false, message: 'Please enter a valid username or email address.' };
      }

      const rateCheck = checkDeviceRateLimit(
        `login_${cleanId}`,
        6,
        15 * 60 * 1000,
        10 * 60 * 1000
      );
      if (!rateCheck.allowed) {
        const remainingMinutes = Math.ceil(rateCheck.remainingSeconds / 60);
        return {
          success: false,
          message: `Too many failed attempts from this device. Please wait ${remainingMinutes} minute(s) before trying again.`,
          lockedOut: true,
          remainingMinutes,
          lockedRemainingSeconds: rateCheck.remainingSeconds,
        };
      }

      let activeUsersList = users;
      let user = activeUsersList.find(
        u =>
          u.id.toLowerCase() === cleanId ||
          u.username.toLowerCase() === cleanId ||
          (u.email && u.email.toLowerCase() === cleanId)
      );

      if (!user) {
        try {
          const directDoc = await fetchDocFromMongoDB('users', cleanId);
          if (directDoc && directDoc.username) {
            user = directDoc as UserAccount;
            setUsers(prev => deduplicateUsers([...prev, user!]));
          } else {
            const pulled = await pullAllDataFromMongoDB();
            if (pulled.success && pulled.data && Array.isArray(pulled.data.users)) {
              const mergedUsers = deduplicateUsers([...activeUsersList, ...pulled.data.users]);
              setUsers(mergedUsers);
              activeUsersList = mergedUsers;
              user = mergedUsers.find(
                (u: UserAccount) =>
                  u.id.toLowerCase() === cleanId ||
                  u.username.toLowerCase() === cleanId ||
                  (u.email && u.email.toLowerCase() === cleanId)
              );
            }
          }
        } catch {
          // Proceed with local state
        }
      }

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials. Please verify your username and password.',
        };
      }

      const lockStatus = isAccountLocked(user.lockedUntil);
      if (lockStatus.isLocked) {
        return {
          success: false,
          message: `This account is temporarily locked due to multiple failed login attempts. Try again in ${lockStatus.remainingMinutes} minute(s) or contact an Administrator.`,
          lockedOut: true,
          remainingMinutes: lockStatus.remainingMinutes,
          lockedRemainingSeconds: lockStatus.remainingMinutes * 60,
        };
      }

      if (password !== undefined) {
        let valid = false;
        let upgradedHash: string | undefined;
        let upgradedSalt: string | undefined;

        if (user.passwordHash && user.passwordSalt) {
          valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
        } else if (user.passwordHash && !user.passwordSalt) {
          valid = constantTimeCompare(password, user.passwordHash);
          if (valid) {
            upgradedSalt = generateSalt();
            upgradedHash = await hashPasswordWithSalt(password, upgradedSalt);
          }
        } else {
          // Default fallback password check for initial accounts without pre-seeded hash
          valid = password === 'Farm@2026!' || password === 'admin123';
          if (valid) {
            upgradedSalt = generateSalt();
            upgradedHash = await hashPasswordWithSalt(password, upgradedSalt);
          }
        }

        if (!valid) {
          const nextAttempts = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = nextAttempts >= 5;
          const lockedUntil = shouldLock
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : null;

          const updatedFailedUser: UserAccount = {
            ...user,
            failedLoginAttempts: nextAttempts,
            lockedUntil,
          };
          setUsers(prev => prev.map(u => (u.id === user!.id ? updatedFailedUser : u)));
          syncUserToBackend(updatedFailedUser);

          if (shouldLock) {
            logAction(
              'SECURITY_LOCKOUT',
              'auth',
              `Account @${user.username} locked for 15 minutes after ${nextAttempts} failed login attempts.`
            );
            return {
              success: false,
              message:
                'Maximum failed attempts (5/5) reached. Your account has been locked for 15 minutes for security.',
              lockedOut: true,
              remainingMinutes: 15,
              lockedRemainingSeconds: 900,
            };
          }

          return {
            success: false,
            message: `Invalid credentials. (${5 - nextAttempts} attempt(s) remaining before security lockout).`,
          };
        }

        if (upgradedHash && upgradedSalt) {
          user = {
            ...user,
            passwordHash: upgradedHash,
            passwordSalt: upgradedSalt,
          };
        }
      }

      if (user.status === 'pending') {
        return {
          success: false,
          message:
            'Your account is still pending approval by the System Administrator. Please check back later.',
        };
      }

      if (user.status === 'rejected') {
        return {
          success: false,
          message:
            'Your account registration was declined by the Administrator. Please contact farm management.',
        };
      }

      if (user.status === 'suspended') {
        return {
          success: false,
          message: 'Your account has been suspended. Please contact the System Administrator.',
        };
      }

      resetDeviceRateLimit(`login_${cleanId}`);
      const finalUser: UserAccount = {
        ...user,
        lastLogin: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      setUsers(prev => prev.map(u => (u.id === finalUser.id ? finalUser : u)));
      setCurrentUser(finalUser);
      try {
        localStorage.setItem('broiler_breeder_active_user', JSON.stringify(finalUser));
      } catch {
        // storage fallback
      }
      syncUserToBackend(finalUser);

      logAction(
        'USER_LOGIN',
        'auth',
        `${finalUser.fullName} (@${finalUser.username}) logged into the system.`
      );
      return {
        success: true,
        message: `Welcome back, ${finalUser.fullName}!`,
        user: finalUser,
      };
    },
    [users, setUsers, setCurrentUser, syncUserToBackend, logAction]
  );

  const logout = useCallback(() => {
    if (currentUser) {
      logAction(
        'USER_LOGOUT',
        'auth',
        `${currentUser.fullName} (@${currentUser.username}) logged out.`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('broiler_breeder_active_user');
  }, [currentUser, setCurrentUser, logAction]);

  const registerUser = useCallback(
    async (
      userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & { password?: string },
      autoActivate: boolean = false
    ): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
      const cleanUsername = sanitizeText(userData.username, 50)
        .replace(/[^a-zA-Z0-9_.\-]/g, '')
        .trim();
      const cleanFullName = sanitizeText(userData.fullName, 100);
      const cleanEmail = sanitizeText(userData.email, 120).toLowerCase();
      const cleanContact = sanitizeText(userData.contactNumber, 35);

      if (!cleanUsername || cleanUsername.length < 3) {
        return {
          success: false,
          message: 'Username must be at least 3 characters (letters, numbers, _, ., -).',
        };
      }

      if (!cleanFullName || cleanFullName.length < 2) {
        return {
          success: false,
          message: 'Please provide a valid full name (at least 2 characters).',
        };
      }

      const existingUsername = users.find(
        u => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (existingUsername) {
        return {
          success: false,
          message: `Username "@${cleanUsername}" is already taken. Please choose another.`,
        };
      }

      if (cleanEmail) {
        const existingEmail = users.find(
          u => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (existingEmail) {
          return {
            success: false,
            message: `Email "${cleanEmail}" is already registered to another user.`,
          };
        }
      }

      const rawPassword = userData.password || 'Farm@2026!';
      const strength = evaluatePasswordStrength(rawPassword);
      if (rawPassword.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long for security.',
        };
      }

      const salt = generateSalt();
      const hashedPassword = await hashPasswordWithSalt(rawPassword, salt);

      let secAnswerHash: string | undefined;
      let secAnswerSalt: string | undefined;
      if (userData.securityAnswer) {
        secAnswerSalt = generateSalt();
        secAnswerHash = await hashSecurityAnswer(userData.securityAnswer, secAnswerSalt);
      }

      const newUser: UserAccount = {
        ...userData,
        username: cleanUsername,
        fullName: cleanFullName,
        email: cleanEmail,
        contactNumber: cleanContact,
        passwordHash: hashedPassword,
        passwordSalt: salt,
        securityQuestion: sanitizeText(userData.securityQuestion, 150),
        securityAnswer: userData.securityAnswer
          ? sanitizeText(userData.securityAnswer, 100)
          : undefined,
        securityAnswerHash: secAnswerHash,
        securityAnswerSalt: secAnswerSalt,
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        status: autoActivate ? 'active' : 'pending',
        createdAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      setUsers(prev => [...prev, newUser]);
      syncUserToBackend(newUser);

      logAction(
        autoActivate ? 'ADMIN_CREATE_USER' : 'USER_REGISTERED',
        'auth',
        autoActivate
          ? `Administrator created & activated account for ${newUser.fullName} (@${newUser.username}) as ${newUser.role} [Security: ${strength.label}].`
          : `New user registration submitted by ${newUser.fullName} (@${newUser.username}) for role [${newUser.role}]. Status: Pending Approval.`
      );

      return {
        success: true,
        message: autoActivate
          ? `User account for ${newUser.fullName} created and activated.`
          : 'Registration submitted! Your account is now pending approval from the System Administrator.',
        user: newUser,
      };
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const recoverAccount = useCallback(
    async (
      identifier: string,
      securityAnswer: string,
      newPassword: string
    ): Promise<{ success: boolean; message: string }> => {
      const cleanId = sanitizeText(identifier, 100).toLowerCase();

      const rateCheck = checkDeviceRateLimit(
        `recover_${cleanId}`,
        5,
        15 * 60 * 1000,
        15 * 60 * 1000
      );
      if (!rateCheck.allowed) {
        return {
          success: false,
          message: `Too many recovery attempts. Please wait ${Math.ceil(rateCheck.remainingSeconds / 60)} minute(s).`,
        };
      }

      const user = users.find(
        u =>
          u.username.toLowerCase() === cleanId ||
          (u.email && u.email.toLowerCase() === cleanId)
      );

      if (!user) {
        return {
          success: false,
          message: 'No account found matching that username or email address.',
        };
      }

      let answerValid = false;
      if (user.securityAnswerHash && user.securityAnswerSalt) {
        const computedAnswerHash = await hashSecurityAnswer(
          securityAnswer,
          user.securityAnswerSalt
        );
        answerValid = constantTimeCompare(computedAnswerHash, user.securityAnswerHash);
      } else if (user.securityAnswer) {
        answerValid =
          user.securityAnswer.trim().toLowerCase() === securityAnswer.trim().toLowerCase();
      }

      if (!answerValid) {
        return {
          success: false,
          message:
            'Security answer does not match our records. Please try again or contact the System Administrator.',
        };
      }

      if (!newPassword || newPassword.trim().length < 8) {
        return {
          success: false,
          message: 'New password must be at least 8 characters long.',
        };
      }

      const newSalt = generateSalt();
      const newHash = await hashPasswordWithSalt(newPassword, newSalt);

      let aSalt = user.securityAnswerSalt;
      let aHash = user.securityAnswerHash;
      if (!aHash && user.securityAnswer) {
        aSalt = generateSalt();
        aHash = await hashSecurityAnswer(user.securityAnswer, aSalt);
      }

      resetDeviceRateLimit(`recover_${cleanId}`);
      resetDeviceRateLimit(`login_${cleanId}`);

      const updatedUser: UserAccount = {
        ...user,
        passwordHash: newHash,
        passwordSalt: newSalt,
        securityAnswerHash: aHash,
        securityAnswerSalt: aSalt,
        passwordChangedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      setUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
      syncUserToBackend(updatedUser);

      logAction(
        'PASSWORD_RECOVERED',
        'auth',
        `Account password reset via security verification for @${user.username}.`
      );

      return {
        success: true,
        message: 'Password has been securely reset! You can now sign in with your new password.',
      };
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const changePassword = useCallback(
    async (
      firstArg: string,
      secondArg: string,
      thirdArg?: string,
      fourthArg?: string,
      fifthArg?: string
    ): Promise<{ success: boolean; message: string }> => {
      // Supports both changePassword(currentPassword, newPassword) and changePassword(userId, currentPassword, newPassword, secQuestion, secAnswer)
      const isTwoArgForm = thirdArg === undefined;
      const targetUserId = isTwoArgForm ? currentUser?.id || '' : firstArg;
      const currentPassword = isTwoArgForm ? firstArg : secondArg;
      const newPassword = isTwoArgForm ? secondArg : thirdArg!;
      const securityQuestion = isTwoArgForm ? undefined : fourthArg;
      const securityAnswer = isTwoArgForm ? undefined : fifthArg;

      const user = users.find(u => u.id === targetUserId);
      if (!user) {
        return { success: false, message: 'User account not found.' };
      }

      let validCurrent = false;
      if (user.passwordHash && user.passwordSalt) {
        validCurrent = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
      } else if (user.passwordHash) {
        validCurrent = constantTimeCompare(currentPassword, user.passwordHash);
      } else {
        validCurrent = currentPassword === 'Farm@2026!' || currentPassword === 'admin123';
      }

      if (!validCurrent) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      if (!newPassword || newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long.' };
      }

      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(newPassword, salt);

      let secQuestion = user.securityQuestion;
      let secAnswer = user.securityAnswer;
      let secAnswerHash = user.securityAnswerHash;
      let secAnswerSalt = user.securityAnswerSalt;

      if (securityQuestion && securityQuestion.trim()) {
        secQuestion = sanitizeText(securityQuestion, 150);
      }
      if (securityAnswer && securityAnswer.trim()) {
        secAnswer = sanitizeText(securityAnswer, 100);
        secAnswerSalt = generateSalt();
        secAnswerHash = await hashSecurityAnswer(secAnswer, secAnswerSalt);
      }

      const updatedUser: UserAccount = {
        ...user,
        passwordHash: hash,
        passwordSalt: salt,
        securityQuestion: secQuestion,
        securityAnswer: secAnswer,
        securityAnswerHash: secAnswerHash,
        securityAnswerSalt: secAnswerSalt,
        passwordChangedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      setUsers(prev => prev.map(u => (u.id === targetUserId ? updatedUser : u)));
      if (currentUser?.id === targetUserId) {
        setCurrentUser(updatedUser);
      }
      syncUserToBackend(updatedUser);

      logAction(
        'PASSWORD_CHANGED',
        'auth',
        `${user.fullName} (@${user.username}) updated their account password and security credentials.`
      );
      return {
        success: true,
        message: 'Your password and security credentials have been updated.',
      };
    },
    [users, currentUser, setUsers, setCurrentUser, syncUserToBackend, logAction]
  );

  const adminResetUserPassword = useCallback(
    async (
      userId: string,
      customPassword?: string
    ): Promise<{ success: boolean; message: string; tempPassword?: string }> => {
      const target = users.find(u => u.id === userId);
      if (!target) {
        return { success: false, message: 'Target user account not found.' };
      }

      const tempPassword =
        customPassword && customPassword.trim().length >= 8
          ? customPassword.trim()
          : 'Farm@' + Math.floor(1000 + Math.random() * 9000) + '!';

      const salt = generateSalt();
      const hash = await hashPasswordWithSalt(tempPassword, salt);

      const updatedUser: UserAccount = {
        ...target,
        passwordHash: hash,
        passwordSalt: salt,
        passwordChangedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      };

      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      syncUserToBackend(updatedUser);
      resetDeviceRateLimit(`login_${target.username.toLowerCase()}`);

      logAction(
        'ADMIN_PASSWORD_RESET',
        'admin',
        `Administrator reset password & cleared security lockouts for ${target.fullName} (@${target.username}).`
      );

      return {
        success: true,
        message: `Password reset for @${target.username}.`,
        tempPassword,
      };
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const adminToggleUserLock = useCallback(
    (
      userId: string,
      forceLockState?: boolean
    ): { success: boolean; message: string } => {
      const target = users.find(u => u.id === userId);
      if (!target) {
        return { success: false, message: 'User not found.' };
      }

      const lockStatus = isAccountLocked(target.lockedUntil);
      const willLock =
        forceLockState !== undefined
          ? forceLockState
          : !(lockStatus.isLocked || (target.failedLoginAttempts || 0) > 0);

      const updatedUser: UserAccount = {
        ...target,
        failedLoginAttempts: 0,
        lockedUntil: willLock ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
      };

      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      syncUserToBackend(updatedUser);

      if (!willLock) {
        resetDeviceRateLimit(`login_${target.username.toLowerCase()}`);
        logAction(
          'ADMIN_UNLOCK_USER',
          'admin',
          `Unlocked account and reset failed login counter for @${target.username}.`
        );
        return {
          success: true,
          message: `Account @${target.username} has been unlocked.`,
        };
      } else {
        logAction(
          'ADMIN_LOCK_USER',
          'admin',
          `Manually locked account @${target.username} for 60 minutes.`
        );
        return {
          success: true,
          message: `Account @${target.username} has been locked for 60 minutes.`,
        };
      }
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const approveUser = useCallback(
    (userId: string, assignedRole?: UserRole, assignedHouses?: string[]) => {
      const target = users.find(u => u.id === userId);
      if (!target) return;
      const updatedUser: UserAccount = {
        ...target,
        status: 'active' as UserStatus,
        role: assignedRole || target.role,
        designatedHouses: assignedHouses || target.designatedHouses,
      };
      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      syncUserToBackend(updatedUser);
      logAction(
        'APPROVE_USER',
        'admin',
        `Approved user registration for ${target.fullName} (@${target.username}) with role [${assignedRole || target.role}].`
      );
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const rejectUser = useCallback(
    (userId: string) => {
      const target = users.find(u => u.id === userId);
      if (!target) return;
      const updatedUser: UserAccount = { ...target, status: 'rejected' as UserStatus };
      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      syncUserToBackend(updatedUser);
      logAction(
        'REJECT_USER',
        'admin',
        `Rejected user registration for ${target.fullName} (@${target.username}).`
      );
    },
    [users, setUsers, syncUserToBackend, logAction]
  );

  const updateUserRole = useCallback(
    (userId: string, newRole: UserRole) => {
      let updatedUser: UserAccount | null = null;
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            updatedUser = { ...u, role: newRole };
            return updatedUser;
          }
          return u;
        })
      );
      if (currentUser?.id === userId) {
        setCurrentUser(prev => (prev ? { ...prev, role: newRole } : null));
      }
      if (updatedUser) {
        syncUserToBackend(updatedUser);
        logAction('UPDATE_USER_ROLE', 'admin', `Updated role to ${newRole} for user ID ${userId}.`);
      }
    },
    [currentUser, setUsers, setCurrentUser, syncUserToBackend, logAction]
  );

  const updateUserStatus = useCallback(
    (userId: string, newStatus: UserStatus) => {
      let updatedUser: UserAccount | null = null;
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            updatedUser = { ...u, status: newStatus };
            return updatedUser;
          }
          return u;
        })
      );
      if (updatedUser) {
        syncUserToBackend(updatedUser);
        logAction(
          'UPDATE_USER_STATUS',
          'admin',
          `Updated status to ${newStatus} for user ID ${userId}.`
        );
      }
    },
    [setUsers, syncUserToBackend, logAction]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      updates: Partial<UserAccount> & { newPassword?: string }
    ): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
      const existing = users.find(u => u.id === userId);
      if (!existing) {
        return { success: false, message: 'Staff profile not found.' };
      }

      if (
        updates.username &&
        updates.username.toLowerCase().trim() !== existing.username.toLowerCase().trim()
      ) {
        const conflict = users.some(
          u =>
            u.id !== userId &&
            u.username.toLowerCase().trim() === updates.username!.toLowerCase().trim()
        );
        if (conflict) {
          return {
            success: false,
            message: `Username "@${updates.username}" is already taken.`,
          };
        }
      }

      if (
        updates.email &&
        updates.email.trim() &&
        updates.email.toLowerCase().trim() !== (existing.email || '').toLowerCase().trim()
      ) {
        const conflict = users.some(
          u =>
            u.id !== userId &&
            u.email &&
            u.email.toLowerCase().trim() === updates.email!.toLowerCase().trim()
        );
        if (conflict) {
          return {
            success: false,
            message: `Email "${updates.email}" is already registered to another staff.`,
          };
        }
      }

      const updatedUser: UserAccount = {
        ...existing,
        ...updates,
        username: updates.username !== undefined ? updates.username.trim() : existing.username,
        fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
        email: updates.email !== undefined ? updates.email.trim() : existing.email,
        contactNumber:
          updates.contactNumber !== undefined
            ? updates.contactNumber.trim()
            : existing.contactNumber,
        role: updates.role || existing.role,
        status: updates.status || existing.status,
        designatedHouses:
          updates.designatedHouses !== undefined
            ? updates.designatedHouses
            : existing.designatedHouses,
      };

      if (updates.newPassword && updates.newPassword.trim().length > 0) {
        if (updates.newPassword.length < 8) {
          return {
            success: false,
            message: 'Password must be at least 8 characters long.',
          };
        }
        const salt = generateSalt();
        const hash = await hashPasswordWithSalt(updates.newPassword, salt);
        updatedUser.passwordHash = hash;
        updatedUser.passwordSalt = salt;
        updatedUser.passwordChangedAt = new Date().toISOString();
        updatedUser.failedLoginAttempts = 0;
        updatedUser.lockedUntil = null;
      }

      if (updates.securityAnswer && updates.securityAnswer.trim().length > 0) {
        const aSalt = generateSalt();
        const aHash = await hashSecurityAnswer(updates.securityAnswer.trim(), aSalt);
        updatedUser.securityAnswerHash = aHash;
        updatedUser.securityAnswerSalt = aSalt;
        updatedUser.securityAnswer = updates.securityAnswer.trim();
      }

      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('broiler_breeder_active_user', JSON.stringify(updatedUser));
        } catch {
          // storage fallback
        }
      }

      syncUserToBackend(updatedUser);
      logAction(
        'STAFF_PROFILE_UPDATED',
        'admin',
        `Updated staff profile for ${updatedUser.fullName} (@${updatedUser.username}) [${updatedUser.role}].`
      );

      return {
        success: true,
        message: `Staff profile for ${updatedUser.fullName} has been updated successfully.`,
        user: updatedUser,
      };
    },
    [users, currentUser, setUsers, setCurrentUser, syncUserToBackend, logAction]
  );

  const addUser = useCallback(
    async (
      userData: Omit<UserAccount, 'id' | 'createdAt' | 'status'> & {
        password?: string;
        status?: UserStatus;
      }
    ): Promise<{ success: boolean; message: string; user?: UserAccount }> => {
      const rawPassword = userData.password || 'Farm@2026!';
      const desiredStatus = userData.status || 'active';

      const res = await registerUser(
        {
          ...userData,
          password: rawPassword,
        },
        desiredStatus === 'active'
      );

      if (!res.success) {
        return res;
      }

      if (res.user && res.user.status !== desiredStatus) {
        const updatedUser = { ...res.user, status: desiredStatus };
        setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        syncUserToBackend(updatedUser);
        return {
          success: true,
          message: `Staff account for ${updatedUser.fullName} created successfully.`,
          user: updatedUser,
        };
      }

      return res;
    },
    [registerUser, setUsers, syncUserToBackend]
  );

  const assignUserHouses = useCallback(
    (userId: string, houses: string[]) => {
      let updatedUser: UserAccount | null = null;
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            updatedUser = { ...u, designatedHouses: houses };
            return updatedUser;
          }
          return u;
        })
      );
      if (updatedUser) {
        syncUserToBackend(updatedUser);
        logAction(
          'ASSIGN_HOUSES',
          'admin',
          `Updated house assignments to [${houses.join(', ')}] for user ID ${userId}.`
        );
      }
    },
    [setUsers, syncUserToBackend, logAction]
  );

  const deleteUser = useCallback(
    (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      deleteDocFromFirestore('users', userId);
      logAction('DELETE_USER', 'admin', `Deleted user ID ${userId}.`);
    },
    [setUsers, deleteDocFromFirestore, logAction]
  );

  const switchUser = useCallback(
    (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
        logAction(
          'SWITCH_USER',
          'auth',
          `Switched active profile to ${user.fullName} [${user.role}].`
        );
      }
    },
    [users, setCurrentUser, logAction]
  );

  const switchUserRole = useCallback(
    (role: UserRole) => {
      const matched = users.find(u => u.role === role);
      if (matched) {
        setCurrentUser(matched);
      } else if (currentUser) {
        const updated = { ...currentUser, role };
        setCurrentUser(updated);
      }
    },
    [users, currentUser, setCurrentUser]
  );

  return {
    login,
    logout,
    registerUser,
    recoverAccount,
    changePassword,
    adminResetUserPassword,
    adminToggleUserLock,
    evaluatePasswordStrength: evaluatePasswordStrength as (
      password: string
    ) => PasswordStrengthResult,
    approveUser,
    rejectUser,
    updateUserRole,
    updateUserStatus,
    updateUser,
    addUser,
    assignUserHouses,
    deleteUser,
    switchUser,
    switchUserRole,
  };
}
