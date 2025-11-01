// Minimal Problem model used by the sidebar list view
// Only includes attributes that the sidebar/TreeView needs to render the list.

class Problem {
	// container for convenience if other modules want to collect instances
	static allProblems = [];

	/**
	 * @param {Object} fields
	 * @param {string|number} fields.questionId - numeric id
	 * @param {string} fields.frontendQuestionId - display id (ex: "1")
	 * @param {string} fields.title - problem title
	 * @param {string} fields.titleSlug - slug used for opening
	 * @param {string} fields.difficulty - Easy/Medium/Hard
	 * @param {string} fields.status - "ac" | "notac" | null
	 * @param {number} fields.likes
	 * @param {number} fields.dislikes
	 * @param {number|string} fields.acRate
	 * @param {Array} fields.topicTags - array of tag objects or names (sidebar only needs name/slug)
	 */
	constructor({
		questionId = null,
		frontendQuestionId = null,
		title = "",
		titleSlug = "",
		difficulty = null,
		status = null,
		likes = 0,
		dislikes = 0,
		acRate = null,
		topicTags = [],
	} = {}) {
		this.questionId = questionId;
		this.frontendQuestionId = frontendQuestionId;
		this.title = title;
		this.titleSlug = titleSlug;
		this.difficulty = difficulty;
		this.status = status;
		this.likes = likes;
		this.dislikes = dislikes;
		this.acRate = acRate;
		this.topicTags = topicTags || [];
	}

	// Factory: create from the GraphQL/question detail object or list item
	static from(obj = {}) {
		// some responses put fields inside `question`, others at root
		const q = obj.question || obj;
		return new Problem({
			id: q.questionId ?? q.id ?? null,
			frontendId: q.frontendId ?? q.questionFrontendId ?? null,
			title: q.title ?? "",
			titleSlug: q.titleSlug ?? "",
			difficulty: q.difficulty ?? null,
			status: q.status ?? null,
			likes: q.likes ?? 0,
			dislikes: q.dislikes ?? 0,
			acRate: q.acRate ?? null,
			topicTags: q.topicTags ?? [],
		});
	}

	// Return a short, human friendly status text used by sidebar
	get statusText() {
		if (this.status === "ac") return "Solved";
		if (this.status === "notac") return "Attempted";
		return "";
	}

	// Small helper for difficulty key
	get difficultyKey() {
		return (this.difficulty || "").toLowerCase();
	}

	// Keep JSON small when serializing for webview
	toJSON() {
		return {
			questionId: this.questionId,
			frontendQuestionId: this.frontendQuestionId,
			title: this.title,
			titleSlug: this.titleSlug,
			difficulty: this.difficulty,
			status: this.status,
			likes: this.likes,
			dislikes: this.dislikes,
			acRate: this.acRate,
			topicTags: this.topicTags,
		};
	}

	addToAll() {
		Problem.allProblems.push(this);
	}
}

export default Problem;
