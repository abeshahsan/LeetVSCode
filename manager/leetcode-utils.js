import * as vscode from "vscode";

// Submit code to LeetCode using session cookies
// Usage: await submitToLeetCode(context, {slug: "two-sum", code: "...", lang: "python3"})
// export async function submitToLeetCode(context, { slug, code, lang }) {
// 	// Get cookies from globalState
// 	const cookies = context.globalState.get("leetcode_cookies");
// 	if (!cookies) throw new Error("No cookies found. Please login first.");

// 	// Build cookie header
// 	const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
// 	// Extract csrftoken from cookies
// 	const csrfCookie = cookies.find((c) => c.name === "csrftoken");
// 	const csrfToken = csrfCookie ? csrfCookie.value : "";

// 	// LeetCode submission endpoint
// 	const url = `https://leetcode.com/problems/${slug}/submit/`; // POST

// 	// Prepare payload
// 	const payload = {
// 		lang,
// 		question_id: await getQuestionId(slug, cookieHeader),
// 		typed_code: code,
// 	};

// 	// Send POST request
// 	const res = await fetch(url, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Cookie: cookieHeader,
// 			Referer: `https://leetcode.com/problems/${slug}/`,
// 			"User-Agent": "Mozilla/5.0",
// 			"x-csrftoken": csrfToken,
// 		},
// 		body: JSON.stringify(payload),
// 	});

// 	let result;
// 	try {
// 		result = await res.json();
// 	} catch {
// 		result = await res.text();
// 	}
// 	if (!res.ok) {
// 		throw new Error(`Submission failed: ${res.status} ${res.statusText}\n${result}`);
// 	}
// 	return result;
// }

// // Helper to get question_id from slug
// async function getQuestionId(slug, cookieHeader) {
// 	const url = `https://leetcode.com/graphql`;
// 	const query = {
// 		operationName: "questionTitle",
// 		variables: { titleSlug: slug },
// 		query: `query questionTitle($titleSlug: String!) { question(titleSlug: $titleSlug) { questionId } }`,
// 	};
// 	const res = await fetch(url, {
// 		method: "POST",
// 		headers: {
// 			"Content-Type": "application/json",
// 			Cookie: cookieHeader,
// 			"User-Agent": "Mozilla/5.0",
// 		},
// 		body: JSON.stringify(query),
// 	});
// 	if (!res.ok) throw new Error("Failed to fetch questionId");
// 	const data = await res.json();
// 	return data?.data?.question?.questionId;
// }

export async function getProblems(start, end) {
	const limit = end - start + 1;
	const skip = start - 1;

	const body = {
		operationName: "problemsetQuestionList",
		variables: {
			categorySlug: "",
			skip,
			limit,
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
		const output = vscode.window.createOutputChannel("LeetCode");

		output.append(JSON.stringify(data.problemsetQuestionList, null, 2));
		output.show();
		if (!res.ok) throw new Error(`Error fetching problems: ${res.status} ${res.statusText}`);
		return Promise.resolve(data);
	} catch (err) {
		return Promise.reject(err);
	}
}
