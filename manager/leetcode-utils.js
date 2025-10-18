export async function getAllProblems(options) {
	const body = {
		operationName: "problemsetQuestionList",
		variables: {
			categorySlug: "",
			limit: 4000,
			skip: 0,
			filters: {},
		},
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
                    freqBar
                    frontendQuestionId: questionFrontendId
                    isFavor
                    paidOnly: isPaidOnly
                    status
                    title
                    titleSlug
                    topicTags {
                        name
                        id
                        slug
                    }
                    hasSolution
                    hasVideoSolution
                    }
                }
            }
				`,
	};

	let cookies = options?.cookies || [];
	const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
	const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value;

	try {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				referer: "https://leetcode.com",
				Cookie: cookieStr,
				"x-csrftoken": csrftoken || "",
			},
			body: JSON.stringify(body),
		});
		const { data } = await res.json();

		if (!res.ok) throw new Error(`Error fetching problems: ${res.status} ${res.statusText}`);
		return Promise.resolve(data);
	} catch (err) {
		return Promise.reject(err);
	}
}

export async function getProblemDetails(slug, options) {
	let cookies = options?.cookies || [];
	const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
	const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value;

	const body = {
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
		  	topicTags {
				name
				id
				slug
			}
			codeSnippets {
			lang
			langSlug
			code
			}
        }
      }
    `,
	};

	try {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Referer: "https://leetcode.com/problems/",
				Cookie: cookieStr,
				"x-csrftoken": csrftoken || "",
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

		const { data, errors } = await res.json();
		console.log(JSON.stringify(data, null, 2));

		if (errors) throw new Error(JSON.stringify(errors, null, 2));
		return data;
	} catch (err) {
		console.error("Fetch failed:", err);
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
