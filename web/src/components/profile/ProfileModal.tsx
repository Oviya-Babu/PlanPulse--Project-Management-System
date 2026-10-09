import React, { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  FolderKanban,
  CheckCircle2,
  Clock,
  ListTodo,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import { getDashboardMetrics } from '../../api/dashboard';
import { DashboardMetrics } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingMetrics(true);
      getDashboardMetrics()
        .then((data) => setMetrics(data))
        .catch(() => setMetrics(null))
        .finally(() => setLoadingMetrics(false));
    }
  }, [isOpen]);

  if (!user) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopyId = () => {
    if (user.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleViewProfilePage = () => {
    onClose();
    navigate('/profile');
  };

  const totalTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                Active Session
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                Tenant Isolated
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight mt-2">
            User Profile
          </DialogTitle>
          <DialogDescription>
            Manage your account details, workspace statistics, and active session.
          </DialogDescription>
        </DialogHeader>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-secondary/50 to-background border border-border mt-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md shadow-primary/20 ring-4 ring-background">
              {getInitials(user.fullName)}
            </div>
            <div
              className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background"
              title="Online"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate">
              {user.fullName}
            </h3>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{user.email}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground bg-background px-2 py-0.5 rounded border border-border transition-colors"
                title="Click to copy Account UUID"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600 font-sans">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{user.id.slice(0, 8)}...</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Quick Statistics */}
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Workspace Statistics</span>
            {loadingMetrics && <span className="animate-pulse">Updating...</span>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
                <span>Projects</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">
                {metrics?.totalProjects ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>{metrics?.projectsInProgress ?? 0} active</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <ListTodo className="h-3.5 w-3.5 text-primary" />
                <span>Total Tasks</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">
                {totalTasks}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>{completedTasks} completed</span>
              </p>
            </div>
          </div>

          {/* Completion Progress Bar */}
          {totalTasks > 0 && (
            <div className="p-3 rounded-lg border border-border bg-secondary/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Delivery Completion</span>
                <span className="font-semibold text-emerald-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Account Details & Security */}
        <div className="rounded-lg border border-border divide-y divide-border text-xs">
          <div className="flex items-center justify-between p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Member Since</span>
            </div>
            <span className="font-medium text-foreground">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) : 'Recently'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Security</span>
            </div>
            <span className="font-medium text-emerald-600">
              Argon2id + Bearer JWT
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleViewProfilePage}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Full Profile Page
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
