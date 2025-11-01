// ProblemDetails model for the problem details view/webview
// Normalizes GraphQL response and exposes a stable JSON shape

class ProblemDetails {
    constructor({
        questionId = null,
        questionFrontendId = null,
        title = "",
        titleSlug = "",
        content = "",
        difficulty = null,
        status = null,
        likes = 0,
        dislikes = 0,
        acRate = null,
        topicTags = [],
        exampleTestcases = "",
        metaData = null,
        codeSnippets = [],
        submissions = null,
    } = {}) {
        this.questionId = questionId;
        this.questionFrontendId = questionFrontendId;
        this.title = title;
        this.titleSlug = titleSlug;
        this.content = content;
        this.difficulty = difficulty;
        this.status = status;
        this.likes = likes;
        this.dislikes = dislikes;
        this.acRate = acRate;
        this.topicTags = topicTags || [];
        this.exampleTestcases = exampleTestcases || "";
        this.metaData = metaData; // keep as string (raw) to match current UI expectations
        this.codeSnippets = Array.isArray(codeSnippets) ? codeSnippets : [];
        this.submissions = submissions;
    }

    static fromGraphQL(res = {}) {
        // res may be { question: {...} } or direct fields
        const q = res.question || res;
        return new ProblemDetails({
            questionId: q.questionId ?? null,
            questionFrontendId: q.questionFrontendId ?? q.frontendId ?? null,
            title: q.title || "",
            titleSlug: q.titleSlug || "",
            content: q.content || "",
            difficulty: q.difficulty ?? null,
            status: q.status ?? null,
            likes: q.likes ?? 0,
            dislikes: q.dislikes ?? 0,
            acRate: q.acRate ?? q.ac_rate ?? null,
            topicTags: q.topicTags ?? [],
            exampleTestcases: q.exampleTestcases || "",
            metaData: q.metaData ?? null,
            codeSnippets: q.codeSnippets ?? [],
            submissions: q.submissions ?? null,
        });
    }

    get statusText() {
        if (this.status === "ac") return "Solved";
        if (this.status === "notac") return "Attempted";
        return "";
    }

    getDefaultLangSlug() {
        return this.codeSnippets?.[0]?.langSlug || "cpp";
    }

    getCodeForLang(langSlug) {
        const found = (this.codeSnippets || []).find((s) => s.langSlug === langSlug);
        return found?.code || "";
    }

    // Keep compatibility with current webview: return both nested question and flattened fields
    toJSON() {
        const q = {
            questionId: this.questionId,
            questionFrontendId: this.questionFrontendId,
            titleSlug: this.titleSlug,
            metaData: this.metaData,
            title: this.title,
            content: this.content,
            difficulty: this.difficulty,
            acRate: this.acRate,
            likes: this.likes,
            status: this.status,
            dislikes: this.dislikes,
            topicTags: this.topicTags,
            codeSnippets: this.codeSnippets,
            exampleTestcases: this.exampleTestcases,
        };

        return {
            question: q,
            // Flattened for direct access where components already support both
            questionId: this.questionId,
            questionFrontendId: this.questionFrontendId,
            titleSlug: this.titleSlug,
            metaData: this.metaData,
            title: this.title,
            content: this.content,
            difficulty: this.difficulty,
            acRate: this.acRate,
            likes: this.likes,
            status: this.status,
            dislikes: this.dislikes,
            topicTags: this.topicTags,
            codeSnippets: this.codeSnippets,
            exampleTestcases: this.exampleTestcases,
        };
    }
}

export default ProblemDetails;
