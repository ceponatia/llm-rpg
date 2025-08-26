import { RepositorySection } from './RepositorySection';

export const LibraryPanel = () => {
	return (
		<div className="space-y-6">
			<h2 className="text-lg font-semibold tracking-tight">Library</h2>
			<div className="grid gap-6 md:grid-cols-2">
				<RepositorySection title="Characters" description="Define personas & traits." />
				<RepositorySection title="Settings" description="World parameters & ambiance." />
				<RepositorySection title="Locations" description="Places for scenes." />
				<RepositorySection title="Objects" description="Items & artifacts." />
			</div>
		</div>
	);
};