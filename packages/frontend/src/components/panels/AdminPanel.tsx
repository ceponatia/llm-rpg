import { useSessionStore } from '../../state/sessionStore';
import React from 'react';
import { AdminFrame } from './AdminFrame';

export const AdminPanel: React.FC = () => {
	const { isAdmin } = useSessionStore();
	const [showEmbedded, setShowEmbedded] = React.useState(true);
	if (!isAdmin) return null;
	return (
		<div className="rounded-lg border border-twilight-700 bg-twilight-900/60 p-4 space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold tracking-tight">Admin Tools</h2>
				<button
					onClick={() => setShowEmbedded(s => !s)}
					className="text-xs px-2 py-1 rounded bg-twilight-700 hover:bg-twilight-600"
				>{showEmbedded ? 'Hide' : 'Show'} Dashboard</button>
			</div>
			<ul className="text-sm text-twilight-300 space-y-1">
				<li>
					<button className="hover:text-accent-400">View Database (placeholder)</button>
				</li>
				<li>
					<a href={((import.meta as unknown) as { env: Record<string,string|undefined> }).env.VITE_ADMIN_DASHBOARD_ORIGIN ?? 'http://localhost:5173'} target="_blank" rel="noreferrer" className="hover:text-accent-400">Open Full Admin Dashboard</a>
				</li>
			</ul>
			{showEmbedded && <AdminFrame />}
			<p className="text-xs text-twilight-500">Embedded view uses iframe integration (Step 5).</p>
		</div>
	);
};