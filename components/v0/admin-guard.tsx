import React, { useEffect, useState } from "react";

interface AdminGuardProps {
  children: React.ReactNode;
  onAuthFailed: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  onAuthFailed,
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify");
        if (response.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          onAuthFailed();
        }
      } catch (error) {
        setIsAdmin(false);
        onAuthFailed();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [onAuthFailed]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-primary/50 500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary/50 500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-atom text-3xl text-primary/50 400 animate-pulse"></i>
          </div>
        </div>
        <div className="text-sm font-black text-zinc-600 uppercase tracking-[0.4em]">
          Decrypting Session
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
};
