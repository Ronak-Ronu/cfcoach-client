import useTheme from "@/hooks/useTheme";

export default function ThemeToggler() {
	const theme = useTheme();

	return (
		<div className="inline-flex">
			<div className="darkmode-toggle">
				<button
					onClick={() => {
						theme.toggle();
					}}
				></button>
			</div>
			<button
				className="ml-3 bg-gray-500/30 rounded-full px-3 text-sm font-medium"
				onClick={() => {
					theme.system();
				}}
			>
				{"System selected: " + theme.isSystemMode.toString()}
			</button>
		</div>
	);
}
