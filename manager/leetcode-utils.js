// OOP refactor: shared base class for GraphQL queries
export class BaseLeetQuery {
	constructor(options = {}) {
		this.endpoint = "https://leetcode.com/graphql";
		this.cookies = options.cookies || [];
		this.cookieStr = this.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
		this.csrftoken = this.cookies.find((c) => c.name === "csrftoken")?.value || "";
	}

	baseHeaders() {
		return {
			"Content-Type": "application/json",
			Cookie: this.cookieStr,
			"x-csrftoken": this.csrftoken,
		};
	}

	async post(body, extraHeaders = {}) {
		const res = await fetch(this.endpoint, {
			method: "POST",
			headers: { ...this.baseHeaders(), ...extraHeaders },
			body: JSON.stringify(body),
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			const msg = json?.errors ? JSON.stringify(json.errors) : `${res.status} ${res.statusText}`;
			throw new Error(`LeetCode GraphQL error: ${msg}`);
		}
		return json;
	}
}

export class ProblemListQuery extends BaseLeetQuery {
	buildBody({ categorySlug = "", limit = 4000, skip = 0, filters = {} } = {}) {
		return {
			operationName: "problemsetQuestionList",
			variables: { categorySlug, limit, skip, filters },
			query: `
				query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
					problemsetQuestionList: questionList(
						categorySlug: $categorySlug
						limit: $limit
						skip: $skip
						filters: $filters
					) {
						total: totalNum
						questions: data {
							acRate
							difficulty
							frontendId: questionFrontendId
							isPaidOnly
							status
							title
							titleSlug
							topicTags { name id slug }
						}
					}
				}
			`,
		};
	}

	async run(params = {}) {
		const body = this.buildBody(params);
		// List endpoint prefers lowercase referer
		const { data } = await this.post(body, { referer: "https://leetcode.com" });
		return data;
	}
}

export class ProblemDetailsQuery extends BaseLeetQuery {
	buildBody(slug) {
		return {
			operationName: "questionData",
			variables: { titleSlug: slug },
			query: `
				query questionData($titleSlug: String!) {
					question(titleSlug: $titleSlug) {
						questionId
						questionFrontendId
						titleSlug
						metaData
						title
						content
						difficulty
						exampleTestcases
						acRate
						likes
						status
						dislikes
						topicTags { name id slug }
						codeSnippets { lang langSlug code }
					}
				}
			`,
		};
	}

	async run(slug) {
		const body = this.buildBody(slug);
		// Details endpoint used capitalized Referer previously
		const { data, errors } = await this.post(body, { Referer: "https://leetcode.com/problems/" });
		if (errors) throw new Error(JSON.stringify(errors, null, 2));
		return data;
	}
}

// Backward-compatible function exports using the OOP classes above
export async function getAllProblems(options) {
	try {
		const client = new ProblemListQuery(options);
		const data = await client.run(options?.params);
		return data;
	} catch (err) {
		return Promise.reject(err);
	}
}

export async function getProblemDetails(slug, options) {
	try {
		const client = new ProblemDetailsQuery(options);
		const data = await client.run(slug);
		return data;
	} catch (err) {
		throw err;
	}
}

export const langToExtentionMap = {
	javascript: "js",
	typescript: "ts",
	python: "py",
	python3: "py",
	java: "java",
	cpp: "cpp",
	c: "c",
	csharp: "cs",
	go: "go",
	rust: "rs",
	kotlin: "kt",
	swift: "swift",
	ruby: "rb",
	scala: "scala",
	php: "php",
	dart: "dart",
	typescriptreact: "tsx",
	javascriptreact: "jsx",
};
