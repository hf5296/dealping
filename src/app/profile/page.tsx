"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Profile {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    activeAlerts: number;
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit name
    const [editingName, setEditingName] = useState(false);
    const [name, setName] = useState("");
    const [nameSaving, setNameSaving] = useState(false);
    const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Change password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/auth/signin?callbackUrl=/profile");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name || "");
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNameSave = async () => {
        setNameSaving(true);
        setNameMessage(null);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                const data = await res.json();
                setProfile((prev) => prev ? { ...prev, name: data.name } : null);
                setEditingName(false);
                setNameMessage({ type: "success", text: "Name updated" });
                // Update the session so header reflects new name
                await update({ name: data.name });
                setTimeout(() => setNameMessage(null), 3000);
            } else {
                const err = await res.json();
                setNameMessage({ type: "error", text: err.error || "Failed to update name" });
            }
        } catch {
            setNameMessage({ type: "error", text: "Failed to update name" });
        } finally {
            setNameSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
            return;
        }

        setPasswordSaving(true);

        try {
            const res = await fetch("/api/user/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                setPasswordMessage({ type: "success", text: "Password updated successfully" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setPasswordMessage(null), 3000);
            } else {
                const err = await res.json();
                setPasswordMessage({ type: "error", text: err.error || "Failed to change password" });
            }
        } catch {
            setPasswordMessage({ type: "error", text: "Failed to change password" });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                        Your Profile
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Manage your account settings
                    </p>
                </div>

                {/* Account Info */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Account Information
                    </h2>

                    {/* Name */}
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Name
                        </label>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                    maxLength={100}
                                />
                                <button
                                    onClick={handleNameSave}
                                    disabled={nameSaving || !name.trim()}
                                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    {nameSaving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingName(false);
                                        setName(profile?.name || "");
                                    }}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <p className="text-gray-900 dark:text-white">
                                    {profile?.name || "Not set"}
                                </p>
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="text-sm font-medium text-emerald-500 hover:text-emerald-600"
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                        {nameMessage && (
                            <p className={`mt-1 text-sm ${nameMessage.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                                {nameMessage.text}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                        <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Email
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {profile?.email}
                        </p>
                    </div>

                    {/* Member since */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
                            Member since
                        </label>
                        <p className="text-gray-900 dark:text-white">
                            {profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })
                                : "—"}
                        </p>
                    </div>
                </section>

                {/* Alerts Summary */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Price Alerts
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {profile?.activeAlerts === 0
                                    ? "No active alerts"
                                    : `${profile?.activeAlerts} active alert${profile?.activeAlerts === 1 ? "" : "s"}`}
                            </p>
                        </div>
                        <Link
                            href="/alerts"
                            className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                        >
                            Manage Alerts
                        </Link>
                    </div>
                </section>

                {/* Change Password */}
                <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Change Password
                    </h2>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {passwordMessage && (
                            <div
                                className={`rounded-lg p-3 text-sm ${
                                    passwordMessage.type === "success"
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                        : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                            >
                                {passwordMessage.text}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="currentPassword"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Current password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="newPassword"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                New password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                                placeholder="Min 8 characters"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Confirm new password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passwordSaving}
                            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                            {passwordSaving ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </section>

                {/* Sign Out */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Sign Out
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Sign out of your account on this device
                            </p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                            Sign Out
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
