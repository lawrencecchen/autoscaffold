import prompts from "prompts";

const questions: Array<prompts.PromptObject> = [
	{
		type: "text",
		name: "dish",
		message: "Do you like pizza?",
	},
	{
		type: (prev) => (prev == "pizza" ? "text" : null),
		name: "topping",
		message: "Name a topping",
	},
];

(async () => {
	const response = await prompts(questions);
})();
