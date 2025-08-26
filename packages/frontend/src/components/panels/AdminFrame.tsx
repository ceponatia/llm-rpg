import React from 'react';
import { useSessionStore } from '../../state/sessionStore';

export const AdminFrame: React.FC = () => {
	const { isAdmin } = useSessionStore();
	if (!isAdmin) return null;
	const src = import.meta.env.VITE_ADMIN_DASHBOARD_ORIGIN || 'http://localhost:5173';
	return (
		<div className="rounded-lg border border-twilight-700 bg-twilight-900/60 p-0 overflow-hidden flex flex-col h-[60vh]">
			<div className="px-3 py-2 text-xs font-medium tracking-wide border-b border-twilight-700 flex items-center justify-between">
				<span>Admin Dashboard</span>
				<a href={src} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">Open Full</a>
			</div>
			<iframe title="Admin Dashboard" src={src} className="flex-1 w-full h-full bg-black" />
		</div>
	);
};