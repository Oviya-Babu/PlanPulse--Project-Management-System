import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Calendar,
  ShieldCheck,
  Copy,
  Check,
  FolderKanban,
  ListTodo,
  LogOut,
  ArrowLeft,
  Activity,
  Layers,
  KeyRound,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { getDashboardMetrics } from '../api/dashboard';
import { DashboardMetrics } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then((data) => setMetrics(data))
      .catch(() => setMetrics(null))
      .finally(() => setLoadingMetrics(false));
  }, []);

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
    await logout();
    navigate('/login');
  };

  const totalTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const inProgressTasks = metrics?.inProgressTasks ?? 0;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-8 space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </Button>
      </div>

      {/* User Hero Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Online Glow */}
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-primary-foreground flex items-center justify-center font-bold text-3xl shadow-lg shadow-primary/25 ring-4 ring-background">
              {getInitials(user.fullName)}
            </div>
            <div
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-card"
              title="Session Active"
            />
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {user.fullName}
              </h1>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Workspace Owner
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Active
                </Badge>
              </div>
            </div>

            <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                }) : 'Recently'}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 font-mono bg-background hover:bg-secondary px-2.5 py-1 rounded-md border border-border transition-colors text-foreground"
                title="Copy User UUID"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-sans">Account ID Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>ID: {user.id.slice(0, 13)}...</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Workspace Performance & Account Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workspace Delivery Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Workspace Metrics</span>
              </CardTitle>
              {loadingMetrics && <span className="text-xs text-muted-foreground animate-pulse">Syncing...</span>}
            </div>
            <CardDescription>
              Aggregated project and delivery performance for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-secondary/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span>Projects</span>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics?.totalProjects ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {metrics?.projectsInProgress ?? 0} currently active
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ListTodo className="h-4 w-4 text-primary" />
                  <span>Tasks</span>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalTasks}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                  {completedTasks} completed
                </p>
              </div>
            </div>

            {/* Delivery Progress Bar */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">Task Completion Rate</span>
                <span className="font-bold text-emerald-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {completedTasks} completed, {inProgressTasks} in progress, and {metrics?.pendingTasks ?? 0} pending.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security & Multi-Tenant Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Security & Protection</span>
            </CardTitle>
            <CardDescription>
              Cryptographic safeguards and tenant isolation policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20">
              <KeyRound className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Argon2id Hashed Credentials</p>
                <p className="text-muted-foreground">
                  Your password is cryptographically hashed using Argon2id with unique cryptographic salts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20">
              <Layers className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Strict Tenant Isolation (Zero IDOR / BOLA)</p>
                <p className="text-muted-foreground">
                  All database queries verify your ownership predicate. Cross-tenant access is impossible.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-secondary/20">
              <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-foreground">Bearer JWT Token Session</p>
                <p className="text-muted-foreground">
                  Your browser session uses stateless HMAC-SHA256 authenticated JSON Web Tokens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
