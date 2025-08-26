interface Props {
	title: string;
	description: string;
}

export const RepositorySection = ({ title, description }: Props) => {
	return (
		<div className="rounded-lg border border-twilight-700 bg-twilight-900/60 p-4 flex flex-col gap-2 hover:border-accent-600/60 transition group">
			<div className="flex items-center justify-between">
				<h3 className="font-medium tracking-tight group-hover:text-accent-400">{title}</h3>
				<button className="text-xs px-2 py-1 rounded bg-twilight-700 hover:bg-twilight-600">Open</button>
			</div>
			<p className="text-xs text-twilight-400 leading-relaxed">{description}</p>
		</div>
	);
};