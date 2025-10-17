import * as vscode from "vscode";



export async function getAllProblems() {
	const body = {
		operationName: "problemsetQuestionList",
		variables: {
			categorySlug: "",
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
            }`,
	};

	let data;
	try {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				referer: "https://leetcode.com",
				// cookie: "LEETCODE_SESSION=<your_session>; csrftoken=<token>",
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
				"x-csrftoken": csrftoken || "", // <-- required
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
