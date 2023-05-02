import ThemeToggler from "@/components/utils/ThemeToggler";

export default function App() {
	return (
		<div className="container mx-auto my-12 text-center py-4">
			<h4 className="italic my-5 text-xl font-black">Theme Toggler</h4>
			<ThemeToggler />
			<h4 className="italic my-3 mt-12 text-xl font-black">Imports</h4>
			<p className="text-gray-600 dark:text-gray-400">
				Path <code>@/Example</code> is equivalent to <code>./src/Example</code>.
			</p>
			<h4 className="italic my-3 mt-6 text-xl font-black">Hooks</h4>
			<p className="text-gray-600 dark:text-gray-400">
				Some useful hooks are provided in <code>/src/hooks</code>.
			</p>

			<h4 className="italic my-3 mt-6 text-xl font-black">Services</h4>
			<p className="text-gray-600 dark:text-gray-400">
				An example of axios is in <code>/src/services</code>.<br />
				You can use this folder for calls to APIs and standardization.
			</p>
			<h4 className="italic my-3 mt-6 text-xl font-black">Types</h4>
			<p className="text-gray-600 dark:text-gray-400">
				Use <code>/src/types</code> for global types spanning whole project.
			</p>
			<h3 className="italic my-3 mt-6 text-2xl font-black text-green-600 dark:text-green-300">
				TailwindCSS &#10003;
			</h3>
		</div>
	);
}
