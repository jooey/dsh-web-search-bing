/**
 * dsh-web-search-bing
 *
 * Two bing search providers for the DSH web capability seam (`ctx.web`):
 *
 * - `bing-cn`  — the domestic mix served by https://cn.bing.com/search
 * - `bing-intl` — the international mix: the same endpoint with ensearch=1
 *
 * There is no official bing HTML API; this provider parses the result page
 * (`<li class="b_algo">` blocks) with a desktop-Chrome UA and unwraps the
 * `bing.com/ck/a` redirect wrapper (the target URL is the base64url `u=a1…`
 * parameter). Bing markup can change; a page that yields zero parsed results
 * fails loudly instead of returning an empty success.
 *
 * A real (non-sandboxed) host plugin: uses native fetch directly.
 */

import z from "@deepseek-ai/schemastery";

/** Cordis plugin name used by loader diagnostics. */
export const name = "web-search-bing";
/** The web seam this provider registers into. */
export const inject = ["web"];

const BING_UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const BING_BASE = "https://cn.bing.com/search";

export const Config = z.object({
	timeoutMs: z.number().step(1).min(1000).default(15000),
	/** Per-request result ceiling the provider asks bing for (the seam caps too). */
	fetchCount: z.number().step(1).min(8).max(30).default(16)
});

/** Minimal HTML entity decoding for titles and snippets. */
function decodeEntities(text) {
	let s = String(text);
	s = s.replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)));
	s = s.replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)));
	const named = { quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", amp: "&" };
	return s.replace(/&([a-zA-Z]+);/g, (m, name) => (Object.hasOwn(named, name) ? named[name] : m));
}

/** Collapse an HTML fragment to plain text. */
function stripTags(html) {
	return decodeEntities(String(html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Unwrap a bing.com/ck/a redirect to its real target (u=a1<base64url>). */
function unwrapBingRedirect(href) {
	const m = /[?&]u=a1([A-Za-z0-9_-]+)/.exec(href);
	if (m === null) return href;
	try {
		return decodeURIComponent(Buffer.from(m[1], "base64url").toString("utf-8"));
	} catch {
		return href;
	}
}

/** Parse the bing result page into seam sources. */
export function parseBing(html) {
	const sources = [];
	for (const block of String(html).split('<li class="b_algo"').slice(1)) {
		const head = /<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
		if (head === null) continue;
		let url = decodeEntities(head[1]);
		if (/bing\.com\/ck\/a/.test(url)) url = unwrapBingRedirect(url);
		if (!/^https?:\/\//.test(url)) continue;
		const title = stripTags(head[2]);
		if (title === "") continue;
		const para = /<p[^>]*>([\s\S]*?)<\/p>/.exec(block);
		const snippet = para !== null ? stripTags(para[1]).slice(0, 320) : "";
		sources.push({ url, title, ...(snippet !== "" ? { snippet } : {}) });
		if (sources.length >= 25) break;
	}
	return sources;
}

/** Build one bing provider; `international` adds the ensearch=1 mix. */
function makeBingProvider(resolveOptions, id, international) {
	return {
		id,
		available() {
			return true;
		},
		async search(request, signal) {
			const options = resolveOptions();
			const params = new URLSearchParams({
				q: request.query,
				count: String(Math.min(Math.max((request.maxResults ?? 8) * 2, options.fetchCount), 30))
			});
			if (international) params.set("ensearch", "1");
			const response = await fetch(`${BING_BASE}?${params.toString()}`, {
				headers: {
					"User-Agent": BING_UA,
					"Accept-Language": international ? "en-US,en;q=0.9" : "zh-CN,zh;q=0.9"
				},
				redirect: "follow",
				signal: signal !== undefined ? signal : AbortSignal.timeout(options.timeoutMs)
			});
			if (!response.ok) throw new Error(`bing/${id}: HTTP ${response.status}`);
			const sources = parseBing(await response.text());
			if (sources.length === 0) throw new Error(`bing/${id}: parsed 0 results — bing markup may have changed`);
			return { sources, truncated: false };
		}
	};
}

/** Build both bing providers from one options snapshot: { cn, intl }. */
export function createBingProviders(options = {}) {
	const resolveOptions = () => ({
		timeoutMs: options.timeoutMs ?? 15000,
		fetchCount: options.fetchCount ?? 16
	});
	return {
		cn: makeBingProvider(resolveOptions, "bing-cn", false),
		intl: makeBingProvider(resolveOptions, "bing-intl", true)
	};
}

/** Register bing-cn and bing-intl search providers with `ctx.web`. */
export function apply(ctx, config = {}) {
	const { cn, intl } = createBingProviders(config);
	ctx.web.registerSearchProvider(cn);
	ctx.web.registerSearchProvider(intl);
	console.log("[web-search-bing] registered bing-cn, bing-intl search providers");
}
